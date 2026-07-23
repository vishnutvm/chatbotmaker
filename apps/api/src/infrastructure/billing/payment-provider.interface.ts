export type CreateCustomerParams = {
  organizationId: string;
  email?: string;
  name?: string;
};

export type CreateCheckoutSessionParams = {
  customerId: string;
  priceId: string;
  organizationId: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey?: string;
};

export type CreatePortalSessionParams = {
  customerId: string;
  returnUrl: string;
};

/** Minimal webhook envelope — Stripe SDK types stay inside the adapter. */
export type PaymentWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

export interface PaymentProvider {
  createCustomer(params: CreateCustomerParams): Promise<{ customerId: string }>;
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ url: string }>;
  createPortalSession(params: CreatePortalSessionParams): Promise<{ url: string }>;
  constructWebhookEvent(rawBody: Buffer, signature: string): PaymentWebhookEvent;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

/** Thrown when STRIPE_SECRET_KEY (or webhook secret) is missing. */
export class PaymentProviderNotConfiguredError extends Error {
  readonly code = 'BILLING_NOT_CONFIGURED';

  constructor(message = 'Stripe billing is not configured') {
    super(message);
    this.name = 'PaymentProviderNotConfiguredError';
  }
}

/** Thrown when Stripe webhook signature verification fails. */
export class StripeWebhookSignatureError extends Error {
  readonly code = 'STRIPE_WEBHOOK_SIGNATURE_INVALID';

  constructor(message = 'Invalid Stripe webhook signature') {
    super(message);
    this.name = 'StripeWebhookSignatureError';
  }
}
