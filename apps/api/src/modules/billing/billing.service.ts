import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  BillingPlanKey,
  BillingSubscriptionResponse,
  BillingSubscriptionStatus,
  CheckoutSessionResponse,
  OrganizationRole,
  PortalSessionResponse,
} from '@genie/types';
import type { OrganizationSubscription } from '@prisma/client';
import {
  getStripeCheckoutCancelUrl,
  getStripeCheckoutSuccessUrl,
  getStripePortalReturnUrl,
  getStripePricePro,
  getStripePriceStarter,
  isStripeBillingConfigured,
} from '../../config/env';
import {
  PAYMENT_PROVIDER,
  PaymentProviderNotConfiguredError,
  StripeWebhookSignatureError,
  type PaymentProvider,
  type PaymentWebhookEvent,
} from '../../infrastructure/billing/payment-provider.interface';
import { OrganizationsService } from '../organizations/organizations.service';
import { PLAN_CATALOG, type PaidPlanKey } from './billing.constants';
import { BillingRateLimiter } from './billing-rate-limiter';
import { BillingRepository } from './billing.repository';
import { StripeWebhookEventRepository } from './stripe-webhook-event.repository';

const MANAGER_ROLES: OrganizationRole[] = ['owner', 'admin'];

const STRIPE_STATUSES = new Set<BillingSubscriptionStatus>([
  'none',
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
]);

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    private readonly billingRepository: BillingRepository,
    private readonly webhookEventRepository: StripeWebhookEventRepository,
    private readonly organizationsService: OrganizationsService,
    private readonly rateLimiter: BillingRateLimiter,
  ) {}

  async getSubscription(
    userId: string,
    organizationId: string,
  ): Promise<BillingSubscriptionResponse> {
    const { membership } = await this.organizationsService.requireMembership(
      userId,
      organizationId,
    );
    const isManager = MANAGER_ROLES.includes(membership.role);
    const row = await this.billingRepository.findByOrganizationId(organizationId);
    const stripeConfigured = isStripeBillingConfigured();

    return this.toStatusResponse(organizationId, row, isManager, stripeConfigured);
  }

  async createCheckoutSession(
    userId: string,
    organizationId: string,
    plan: PaidPlanKey,
  ): Promise<CheckoutSessionResponse> {
    this.rateLimiter.assertWithinLimits(userId, organizationId);
    const { organization } = await this.organizationsService.requireManagerMembership(
      userId,
      organizationId,
    );

    this.assertStripeConfigured();

    const priceId = this.priceIdForPlan(plan);
    if (!priceId) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'BILLING_NOT_CONFIGURED',
        message: 'Stripe price IDs are not configured',
      });
    }

    let row = await this.billingRepository.findByOrganizationId(organizationId);
    if (row?.plan === plan && (row.status === 'active' || row.status === 'trialing')) {
      throw new BadRequestException(`Organization is already on the ${plan} plan`);
    }

    if (!row?.stripeCustomerId) {
      const { customerId } = await this.mapProviderCall(() =>
        this.paymentProvider.createCustomer({
          organizationId,
          name: organization.name,
        }),
      );

      if (row) {
        row = await this.billingRepository.updateCustomerId(organizationId, customerId);
      } else {
        row = await this.billingRepository.create({
          organizationId,
          stripeCustomerId: customerId,
        });
      }
    }

    const session = await this.mapProviderCall(() =>
      this.paymentProvider.createCheckoutSession({
        customerId: row!.stripeCustomerId!,
        priceId,
        organizationId,
        successUrl: getStripeCheckoutSuccessUrl(),
        cancelUrl: getStripeCheckoutCancelUrl(),
        // Unique per attempt — static keys can return a stale Checkout URL for ~24h.
        idempotencyKey: `checkout:${organizationId}:${plan}:${row!.stripeCustomerId}:${Date.now()}`,
      }),
    );

    return { url: session.url };
  }

  async createPortalSession(
    userId: string,
    organizationId: string,
  ): Promise<PortalSessionResponse> {
    this.rateLimiter.assertWithinLimits(userId, organizationId);
    await this.organizationsService.requireManagerMembership(userId, organizationId);
    this.assertStripeConfigured();

    const row = await this.billingRepository.findByOrganizationId(organizationId);
    if (!row?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer for this organization');
    }

    const session = await this.mapProviderCall(() =>
      this.paymentProvider.createPortalSession({
        customerId: row.stripeCustomerId!,
        returnUrl: getStripePortalReturnUrl(),
      }),
    );

    return { url: session.url };
  }

  async handleStripeWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): Promise<{ received: true }> {
    if (!rawBody || !Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      throw new BadRequestException('Missing raw body');
    }
    if (!signature?.trim()) {
      throw new BadRequestException('Missing Stripe-Signature header');
    }

    let event: PaymentWebhookEvent;
    try {
      event = this.paymentProvider.constructWebhookEvent(rawBody, signature);
    } catch (error) {
      if (error instanceof PaymentProviderNotConfiguredError) {
        throw this.toServiceUnavailable(error);
      }
      if (error instanceof StripeWebhookSignatureError) {
        throw new BadRequestException('Invalid Stripe webhook signature');
      }
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    return this.applyStripeEvent(event);
  }

  /**
   * Idempotent webhook apply — public for unit tests.
   * Duplicate event.id with processedAt set → no-op.
   * Duplicate with processedAt null (prior failure) → re-apply so Stripe retries succeed.
   */
  async applyStripeEvent(event: PaymentWebhookEvent): Promise<{ received: true }> {
    const inserted = await this.webhookEventRepository.tryCreate(event.id, event.type);
    if (!inserted) {
      const existing = await this.webhookEventRepository.findByEventId(event.id);
      if (existing?.processedAt) {
        return { received: true };
      }
      // Prior insert failed before markProcessed — re-enter apply path.
    }

    try {
      await this.dispatchStripeEvent(event);
      await this.webhookEventRepository.markProcessed(event.id);
    } catch (error) {
      this.logger.error('Failed to apply Stripe webhook event', {
        eventType: event.type,
        eventId: event.id,
      });
      throw error;
    }

    return { received: true };
  }

  private async dispatchStripeEvent(event: PaymentWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpsert(event.data.object, event.type);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object, event.type);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object, event.type);
        break;
      default:
        break;
    }
  }

  private async handleCheckoutSessionCompleted(object: Record<string, unknown>): Promise<void> {
    const customerId = this.asString(object.customer);
    const subscriptionId = this.asString(object.subscription);

    if (!this.readMetadataOrganizationId(object) && !customerId) {
      return;
    }

    const orgId = await this.resolveOrganizationIdForEvent(object, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    });

    if (!orgId) {
      return;
    }

    // Checkout completion alone does not set paid plan — wait for subscription events.
    // Ensure customer id is bound for Portal.
    if (customerId) {
      const existing = await this.billingRepository.findByOrganizationId(orgId);
      if (!existing) {
        await this.billingRepository.create({
          organizationId: orgId,
          stripeCustomerId: customerId,
        });
      } else if (!existing.stripeCustomerId) {
        await this.billingRepository.updateCustomerId(orgId, customerId);
      }
    }
  }

  private async handleSubscriptionUpsert(
    object: Record<string, unknown>,
    eventType: string,
  ): Promise<void> {
    const subscriptionId = this.asString(object.id);
    const customerId = this.asString(object.customer);
    const priceId = this.extractPriceId(object);
    const organizationId = await this.resolveOrganizationIdForEvent(object, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    });

    if (!organizationId) {
      this.logger.warn('Stripe subscription event missing organization binding', { eventType });
      return;
    }

    const mappedPlan = priceId ? this.planKeyForPriceId(priceId) : null;
    if (priceId && mappedPlan === null) {
      this.logger.warn('Unknown Stripe price id — skipping plan sync', {
        eventType,
        organizationId,
      });
      const existing = await this.billingRepository.findByOrganizationId(organizationId);
      const status = this.mapStripeStatus(this.asString(object.status));
      await this.billingRepository.upsertAndSyncOrgPlan({
        organizationId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        // Keep prior plan — never demote to free on unrecognized price.
        plan: (existing?.plan as BillingPlanKey) || 'free',
        status,
        cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
        currentPeriodStart: this.readUnixTimestamp(object.current_period_start),
        currentPeriodEnd: this.readUnixTimestamp(object.current_period_end),
        syncOrgPlan: false,
      });
      return;
    }

    const plan: BillingPlanKey = mappedPlan ?? 'free';
    const status = this.mapStripeStatus(this.asString(object.status));
    const cancelAtPeriodEnd = Boolean(object.cancel_at_period_end);
    const currentPeriodStart = this.readUnixTimestamp(object.current_period_start);
    const currentPeriodEnd = this.readUnixTimestamp(object.current_period_end);

    await this.billingRepository.upsertAndSyncOrgPlan({
      organizationId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      plan,
      status,
      cancelAtPeriodEnd,
      currentPeriodStart,
      currentPeriodEnd,
    });

    this.logger.log('Billing plan updated', {
      organizationId,
      plan,
      eventType,
    });
  }

  private async handleSubscriptionDeleted(
    object: Record<string, unknown>,
    eventType: string,
  ): Promise<void> {
    const subscriptionId = this.asString(object.id);
    const customerId = this.asString(object.customer);
    const organizationId = await this.resolveOrganizationIdForEvent(object, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    });

    if (!organizationId) {
      this.logger.warn('Stripe subscription.deleted missing organization binding', { eventType });
      return;
    }

    await this.billingRepository.upsertAndSyncOrgPlan({
      organizationId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
      stripePriceId: null,
      plan: 'free',
      status: 'canceled',
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: this.readUnixTimestamp(object.current_period_end),
    });

    this.logger.log('Billing plan updated', {
      organizationId,
      plan: 'free',
      eventType,
    });
  }

  private async handleInvoicePaymentFailed(
    object: Record<string, unknown>,
    eventType: string,
  ): Promise<void> {
    const customerId = this.asString(object.customer);
    const subscriptionId = this.asString(object.subscription);
    const organizationId = await this.resolveOrganizationId({
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    });

    if (!organizationId) {
      return;
    }

    const existing = await this.billingRepository.findByOrganizationId(organizationId);
    await this.billingRepository.upsertAndSyncOrgPlan({
      organizationId,
      stripeCustomerId: customerId ?? existing?.stripeCustomerId,
      stripeSubscriptionId: subscriptionId ?? existing?.stripeSubscriptionId,
      stripePriceId: existing?.stripePriceId,
      plan: (existing?.plan as BillingPlanKey) || 'free',
      status: 'past_due',
      cancelAtPeriodEnd: existing?.cancelAtPeriodEnd,
      currentPeriodStart: existing?.currentPeriodStart,
      currentPeriodEnd: existing?.currentPeriodEnd,
    });

    this.logger.log('Billing plan updated', {
      organizationId,
      plan: existing?.plan ?? 'free',
      eventType,
    });
  }

  private async resolveOrganizationId(ids: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }): Promise<string | null> {
    if (ids.stripeSubscriptionId) {
      const bySub = await this.billingRepository.findByStripeSubscriptionId(
        ids.stripeSubscriptionId,
      );
      if (bySub) {
        return bySub.organizationId;
      }
    }
    if (ids.stripeCustomerId) {
      const byCustomer = await this.billingRepository.findByStripeCustomerId(ids.stripeCustomerId);
      if (byCustomer) {
        return byCustomer.organizationId;
      }
    }
    return null;
  }

  /**
   * Prefer Stripe customer/subscription binding over metadata.
   * When both exist and disagree, keep the binding (log warn).
   */
  private async resolveOrganizationIdForEvent(
    object: Record<string, unknown>,
    ids: {
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
    },
  ): Promise<string | null> {
    const fromBinding = await this.resolveOrganizationId(ids);
    const fromMeta = this.readMetadataOrganizationId(object);
    if (fromBinding && fromMeta && fromBinding !== fromMeta) {
      this.logger.warn('Stripe metadata organizationId mismatch; using customer/subscription binding', {
        fromBinding,
        fromMeta,
      });
      return fromBinding;
    }
    return fromBinding ?? fromMeta;
  }

  /** Maps known env price IDs; returns null for unrecognized prices (do not demote to free). */
  planKeyForPriceId(priceId: string): BillingPlanKey | null {
    const starter = getStripePriceStarter();
    const pro = getStripePricePro();
    if (starter && priceId === starter) {
      return 'starter';
    }
    if (pro && priceId === pro) {
      return 'pro';
    }
    return null;
  }

  private priceIdForPlan(plan: PaidPlanKey): string | undefined {
    if (plan === 'starter') {
      return getStripePriceStarter();
    }
    return getStripePricePro();
  }

  private toStatusResponse(
    organizationId: string,
    row: OrganizationSubscription | null,
    isManager: boolean,
    stripeConfigured: boolean,
  ): BillingSubscriptionResponse {
    const plan = this.asPlanKey(row?.plan) ?? 'free';
    const status = this.mapStripeStatus(row?.status ?? 'none');

    return {
      organizationId,
      plan,
      status,
      cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
      currentPeriodEnd: row?.currentPeriodEnd?.toISOString() ?? null,
      canCheckout: isManager && stripeConfigured,
      canManageBilling: isManager && Boolean(row?.stripeCustomerId),
      plans: PLAN_CATALOG,
    };
  }

  private assertStripeConfigured(): void {
    if (!isStripeBillingConfigured()) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        code: 'BILLING_NOT_CONFIGURED',
        message: 'Stripe billing is not configured',
      });
    }
  }

  private async mapProviderCall<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof PaymentProviderNotConfiguredError) {
        throw this.toServiceUnavailable(error);
      }
      throw error;
    }
  }

  private toServiceUnavailable(error: PaymentProviderNotConfiguredError): ServiceUnavailableException {
    return new ServiceUnavailableException({
      statusCode: 503,
      code: error.code,
      message: error.message,
    });
  }

  private readMetadataOrganizationId(object: Record<string, unknown>): string | null {
    const metadata = object.metadata;
    if (!metadata || typeof metadata !== 'object') {
      return null;
    }
    const organizationId = (metadata as Record<string, unknown>).organizationId;
    return typeof organizationId === 'string' && organizationId.trim()
      ? organizationId.trim()
      : null;
  }

  private extractPriceId(object: Record<string, unknown>): string | null {
    const items = object.items as { data?: Array<{ price?: { id?: string } | string }> } | undefined;
    const first = items?.data?.[0];
    if (!first) {
      return null;
    }
    if (typeof first.price === 'string') {
      return first.price;
    }
    if (first.price && typeof first.price === 'object' && typeof first.price.id === 'string') {
      return first.price.id;
    }
    return null;
  }

  private readUnixTimestamp(value: unknown): Date | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }
    return new Date(value * 1000);
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private asPlanKey(value: string | null | undefined): BillingPlanKey | null {
    if (value === 'free' || value === 'starter' || value === 'pro') {
      return value;
    }
    return null;
  }

  private mapStripeStatus(value: string | null | undefined): BillingSubscriptionStatus {
    if (value && STRIPE_STATUSES.has(value as BillingSubscriptionStatus)) {
      return value as BillingSubscriptionStatus;
    }
    return 'none';
  }
}
