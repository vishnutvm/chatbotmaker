import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { getStripeSecretKey, getStripeWebhookSecret } from '../../config/env';
import type {
  CreateCheckoutSessionParams,
  CreateCustomerParams,
  CreatePortalSessionParams,
  PaymentProvider,
  PaymentWebhookEvent,
} from './payment-provider.interface';
import {
  PaymentProviderNotConfiguredError,
  StripeWebhookSignatureError,
} from './payment-provider.interface';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(StripePaymentProvider.name);
  private client: Stripe | null = null;

  private getClient(): Stripe {
    const apiKey = getStripeSecretKey();
    if (!apiKey) {
      throw new PaymentProviderNotConfiguredError('STRIPE_SECRET_KEY is not configured');
    }
    if (!this.client) {
      this.client = new Stripe(apiKey, {
        maxNetworkRetries: 1,
        timeout: 20_000,
      });
    }
    return this.client;
  }

  async createCustomer(params: CreateCustomerParams): Promise<{ customerId: string }> {
    const client = this.getClient();
    try {
      const customer = await client.customers.create({
        email: params.email,
        name: params.name,
        metadata: { organizationId: params.organizationId },
      });
      return { customerId: customer.id };
    } catch (error) {
      this.rethrowUpstream(error, 'createCustomer');
    }
  }

  async createCheckoutSession(
    params: CreateCheckoutSessionParams,
  ): Promise<{ url: string }> {
    const client = this.getClient();
    try {
      const session = await client.checkout.sessions.create(
        {
          mode: 'subscription',
          customer: params.customerId,
          line_items: [{ price: params.priceId, quantity: 1 }],
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          metadata: { organizationId: params.organizationId },
          subscription_data: {
            metadata: { organizationId: params.organizationId },
          },
        },
        params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined,
      );

      if (!session.url) {
        throw new BadGatewayException({
          statusCode: 502,
          code: 'STRIPE_CHECKOUT_URL_MISSING',
          message: 'Stripe Checkout session did not return a URL',
        });
      }

      return { url: session.url };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      this.rethrowUpstream(error, 'createCheckoutSession');
    }
  }

  async createPortalSession(params: CreatePortalSessionParams): Promise<{ url: string }> {
    const client = this.getClient();
    try {
      const session = await client.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });
      return { url: session.url };
    } catch (error) {
      this.rethrowUpstream(error, 'createPortalSession');
    }
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): PaymentWebhookEvent {
    const webhookSecret = getStripeWebhookSecret();
    if (!webhookSecret) {
      throw new PaymentProviderNotConfiguredError('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      const event = Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      return {
        id: event.id,
        type: event.type,
        data: {
          object: event.data.object as unknown as Record<string, unknown>,
        },
      };
    } catch (error) {
      if (error instanceof PaymentProviderNotConfiguredError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Invalid Stripe webhook signature';
      throw new StripeWebhookSignatureError(message);
    }
  }

  private rethrowUpstream(error: unknown, operation: string): never {
    if (error instanceof PaymentProviderNotConfiguredError) {
      throw error;
    }
    if (error instanceof BadGatewayException) {
      throw error;
    }

    this.logger.warn(`Stripe ${operation} failed`, {
      name: error instanceof Error ? error.name : 'unknown',
    });

    throw new BadGatewayException({
      statusCode: 502,
      code: 'STRIPE_UPSTREAM_ERROR',
      message: 'Stripe request failed',
    });
  }
}
