import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingRateLimiter } from './billing-rate-limiter';
import type { BillingRepository } from './billing.repository';
import type { StripeWebhookEventRepository } from './stripe-webhook-event.repository';
import type { OrganizationsService } from '../organizations/organizations.service';
import type { PaymentProvider } from '../../infrastructure/billing/payment-provider.interface';
import { PaymentProviderNotConfiguredError } from '../../infrastructure/billing/payment-provider.interface';

describe('BillingService', () => {
  const org = {
    id: 'org-1',
    name: 'Acme',
    slug: 'acme',
    ownerId: 'user-1',
    plan: 'free',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ownerMembership = {
    id: 'm1',
    userId: 'user-1',
    organizationId: 'org-1',
    role: 'owner' as const,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    organization: org,
  };

  const memberMembership = {
    ...ownerMembership,
    id: 'm2',
    userId: 'user-2',
    role: 'member' as const,
  };

  let paymentProvider: jest.Mocked<PaymentProvider>;
  let billingRepository: jest.Mocked<BillingRepository>;
  let webhookEventRepository: jest.Mocked<StripeWebhookEventRepository>;
  let organizationsService: jest.Mocked<
    Pick<OrganizationsService, 'requireMembership' | 'requireManagerMembership'>
  >;
  let rateLimiter: BillingRateLimiter;
  let service: BillingService;

  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_STARTER;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    paymentProvider = {
      createCustomer: jest.fn(),
      createCheckoutSession: jest.fn(),
      createPortalSession: jest.fn(),
      constructWebhookEvent: jest.fn(),
    };

    billingRepository = {
      findByOrganizationId: jest.fn(),
      findByStripeCustomerId: jest.fn(),
      findByStripeSubscriptionId: jest.fn(),
      create: jest.fn(),
      updateCustomerId: jest.fn(),
      upsertAndSyncOrgPlan: jest.fn(),
    } as unknown as jest.Mocked<BillingRepository>;

    webhookEventRepository = {
      findByEventId: jest.fn(),
      tryCreate: jest.fn(),
      markProcessed: jest.fn(),
    } as unknown as jest.Mocked<StripeWebhookEventRepository>;

    organizationsService = {
      requireMembership: jest.fn(),
      requireManagerMembership: jest.fn(),
    };

    rateLimiter = new BillingRateLimiter();
    rateLimiter.reset();

    service = new BillingService(
      paymentProvider,
      billingRepository,
      webhookEventRepository,
      organizationsService as unknown as OrganizationsService,
      rateLimiter,
    );
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function configureStripeEnv() {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.STRIPE_PRICE_STARTER = 'price_starter';
    process.env.STRIPE_PRICE_PRO = 'price_pro';
  }

  it('returns free/none when no subscription row exists', async () => {
    organizationsService.requireMembership.mockResolvedValue({
      organization: org,
      membership: ownerMembership,
    });
    billingRepository.findByOrganizationId.mockResolvedValue(null);

    const result = await service.getSubscription('user-1', 'org-1');

    expect(result).toMatchObject({
      organizationId: 'org-1',
      plan: 'free',
      status: 'none',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      canCheckout: false,
      canManageBilling: false,
    });
    expect(result.plans).toHaveLength(3);
    expect(paymentProvider.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('sets canCheckout when manager and Stripe configured', async () => {
    configureStripeEnv();
    organizationsService.requireMembership.mockResolvedValue({
      organization: org,
      membership: ownerMembership,
    });
    billingRepository.findByOrganizationId.mockResolvedValue(null);

    const result = await service.getSubscription('user-1', 'org-1');
    expect(result.canCheckout).toBe(true);
    expect(result.canManageBilling).toBe(false);
  });

  it('rejects free plan checkout via manager path (DTO prevents free; service assumes paid)', async () => {
    configureStripeEnv();
    organizationsService.requireManagerMembership.mockRejectedValue(
      new ForbiddenException('Owner or admin role required'),
    );

    await expect(
      service.createCheckoutSession('user-2', 'org-1', 'starter'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(paymentProvider.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('allows manager checkout and refuses to set organizations.plan', async () => {
    configureStripeEnv();
    organizationsService.requireManagerMembership.mockResolvedValue({
      organization: org,
      membership: ownerMembership,
    });
    billingRepository.findByOrganizationId.mockResolvedValue(null);
    paymentProvider.createCustomer.mockResolvedValue({ customerId: 'cus_1' });
    billingRepository.create.mockResolvedValue({
      id: 'subrow-1',
      organizationId: 'org-1',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: null,
      stripePriceId: null,
      plan: 'free',
      status: 'none',
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentProvider.createCheckoutSession.mockResolvedValue({
      url: 'https://checkout.stripe.com/c/pay/test',
    });

    const result = await service.createCheckoutSession('user-1', 'org-1', 'starter');

    expect(result.url).toContain('checkout.stripe.com');
    expect(billingRepository.upsertAndSyncOrgPlan).not.toHaveBeenCalled();
    expect(paymentProvider.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        name: 'Acme',
      }),
    );
  });

  it('rejects member checkout via requireManagerMembership', async () => {
    configureStripeEnv();
    organizationsService.requireManagerMembership.mockRejectedValue(
      new ForbiddenException('Owner or admin role required'),
    );

    await expect(
      service.createCheckoutSession('user-2', 'org-1', 'pro'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('maps Stripe price ids to plan keys', () => {
    configureStripeEnv();
    expect(service.planKeyForPriceId('price_starter')).toBe('starter');
    expect(service.planKeyForPriceId('price_pro')).toBe('pro');
    expect(service.planKeyForPriceId('price_unknown')).toBeNull();
  });

  it('skips duplicate webhook events when already processed (idempotent)', async () => {
    webhookEventRepository.tryCreate.mockResolvedValue(null);
    webhookEventRepository.findByEventId.mockResolvedValue({
      id: 'row-dup',
      eventId: 'evt_dup',
      type: 'customer.subscription.updated',
      processedAt: new Date(),
      createdAt: new Date(),
    });

    const result = await service.applyStripeEvent({
      id: 'evt_dup',
      type: 'customer.subscription.updated',
      data: { object: {} },
    });

    expect(result).toEqual({ received: true });
    expect(billingRepository.upsertAndSyncOrgPlan).not.toHaveBeenCalled();
    expect(webhookEventRepository.markProcessed).not.toHaveBeenCalled();
  });

  it('re-applies webhook when prior attempt left processedAt null', async () => {
    configureStripeEnv();
    webhookEventRepository.tryCreate.mockResolvedValue(null);
    webhookEventRepository.findByEventId.mockResolvedValue({
      id: 'row-retry',
      eventId: 'evt_retry',
      type: 'customer.subscription.deleted',
      processedAt: null,
      createdAt: new Date(),
    });
    billingRepository.findByStripeSubscriptionId.mockResolvedValue({
      id: 'subrow-1',
      organizationId: 'org-1',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
      stripePriceId: 'price_starter',
      plan: 'starter',
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    billingRepository.upsertAndSyncOrgPlan.mockResolvedValue({} as never);
    webhookEventRepository.markProcessed.mockResolvedValue({} as never);

    await service.applyStripeEvent({
      id: 'evt_retry',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'canceled',
        },
      },
    });

    expect(billingRepository.upsertAndSyncOrgPlan).toHaveBeenCalled();
    expect(webhookEventRepository.markProcessed).toHaveBeenCalledWith('evt_retry');
  });

  it('does not demote plan to free on unknown Stripe price id', async () => {
    configureStripeEnv();
    webhookEventRepository.tryCreate.mockResolvedValue({
      id: 'row-unk',
      eventId: 'evt_unk',
      type: 'customer.subscription.updated',
      processedAt: null,
      createdAt: new Date(),
    });
    billingRepository.findByStripeCustomerId.mockResolvedValue({
      id: 'subrow-1',
      organizationId: 'org-1',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_old',
      stripePriceId: 'price_starter',
      plan: 'starter',
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    billingRepository.findByOrganizationId.mockResolvedValue({
      id: 'subrow-1',
      organizationId: 'org-1',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_old',
      stripePriceId: 'price_starter',
      plan: 'starter',
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    billingRepository.upsertAndSyncOrgPlan.mockResolvedValue({} as never);
    webhookEventRepository.markProcessed.mockResolvedValue({} as never);

    await service.applyStripeEvent({
      id: 'evt_unk',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_2',
          customer: 'cus_1',
          status: 'active',
          items: { data: [{ price: { id: 'price_unknown' } }] },
        },
      },
    });

    expect(billingRepository.upsertAndSyncOrgPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        plan: 'starter',
        stripePriceId: 'price_unknown',
        syncOrgPlan: false,
      }),
    );
  });

  it('sets plan free and clears subscription id on subscription.deleted', async () => {
    configureStripeEnv();
    webhookEventRepository.tryCreate.mockResolvedValue({
      id: 'row-1',
      eventId: 'evt_del',
      type: 'customer.subscription.deleted',
      processedAt: null,
      createdAt: new Date(),
    });
    billingRepository.findByStripeSubscriptionId.mockResolvedValue({
      id: 'subrow-1',
      organizationId: 'org-1',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
      stripePriceId: 'price_starter',
      plan: 'starter',
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    billingRepository.upsertAndSyncOrgPlan.mockResolvedValue({} as never);
    webhookEventRepository.markProcessed.mockResolvedValue({} as never);

    await service.applyStripeEvent({
      id: 'evt_del',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_1',
          customer: 'cus_1',
          status: 'canceled',
        },
      },
    });

    expect(billingRepository.upsertAndSyncOrgPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: null,
        stripePriceId: null,
        plan: 'free',
        status: 'canceled',
      }),
    );
  });

  it('applies subscription.updated with price→plan mapping', async () => {
    configureStripeEnv();
    webhookEventRepository.tryCreate.mockResolvedValue({
      id: 'row-2',
      eventId: 'evt_upd',
      type: 'customer.subscription.updated',
      processedAt: null,
      createdAt: new Date(),
    });
    billingRepository.findByStripeCustomerId.mockResolvedValue({
      id: 'subrow-1',
      organizationId: 'org-1',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: null,
      stripePriceId: null,
      plan: 'free',
      status: 'none',
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    billingRepository.upsertAndSyncOrgPlan.mockResolvedValue({} as never);
    webhookEventRepository.markProcessed.mockResolvedValue({} as never);

    await service.applyStripeEvent({
      id: 'evt_upd',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_2',
          customer: 'cus_1',
          status: 'active',
          cancel_at_period_end: false,
          current_period_start: 1_700_000_000,
          current_period_end: 1_700_100_000,
          items: { data: [{ price: { id: 'price_pro' } }] },
          metadata: { organizationId: 'org-1' },
        },
      },
    });

    expect(billingRepository.upsertAndSyncOrgPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        plan: 'pro',
        status: 'active',
        stripePriceId: 'price_pro',
        stripeSubscriptionId: 'sub_2',
      }),
    );
  });

  it('maps PaymentProviderNotConfiguredError to 503 on checkout', async () => {
    configureStripeEnv();
    organizationsService.requireManagerMembership.mockResolvedValue({
      organization: org,
      membership: ownerMembership,
    });
    billingRepository.findByOrganizationId.mockResolvedValue({
      id: 'subrow-1',
      organizationId: 'org-1',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: null,
      stripePriceId: null,
      plan: 'free',
      status: 'none',
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentProvider.createCheckoutSession.mockRejectedValue(
      new PaymentProviderNotConfiguredError(),
    );

    await expect(
      service.createCheckoutSession('user-1', 'org-1', 'starter'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('returns canManageBilling false for members even with customer', async () => {
    configureStripeEnv();
    organizationsService.requireMembership.mockResolvedValue({
      organization: org,
      membership: memberMembership,
    });
    billingRepository.findByOrganizationId.mockResolvedValue({
      id: 'subrow-1',
      organizationId: 'org-1',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
      stripePriceId: 'price_starter',
      plan: 'starter',
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.getSubscription('user-2', 'org-1');
    expect(result.canCheckout).toBe(false);
    expect(result.canManageBilling).toBe(false);
    expect(result.plan).toBe('starter');
  });

  it('rejects webhook without raw body', async () => {
    await expect(service.handleStripeWebhook(undefined, 'sig')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
