import type {
  BillingSubscriptionResponse,
  CheckoutSessionResponse,
  CreateCheckoutSessionRequest,
  PortalSessionResponse,
} from '@genie/types';
import { GenieApiClient } from './client';

/** Org-scoped Stripe billing (subscription status, Checkout, Portal). */
export class GenieBillingClient extends GenieApiClient {
  getSubscription(
    accessToken: string,
    organizationId: string,
  ): Promise<BillingSubscriptionResponse> {
    return this.getJson<BillingSubscriptionResponse>(
      `/api/v1/organizations/${organizationId}/billing/subscription`,
      accessToken,
    );
  }

  createCheckoutSession(
    accessToken: string,
    organizationId: string,
    body: CreateCheckoutSessionRequest,
  ): Promise<CheckoutSessionResponse> {
    return this.postJson<CheckoutSessionResponse>(
      `/api/v1/organizations/${organizationId}/billing/checkout-session`,
      body,
      accessToken,
    );
  }

  createPortalSession(
    accessToken: string,
    organizationId: string,
  ): Promise<PortalSessionResponse> {
    return this.postJson<PortalSessionResponse>(
      `/api/v1/organizations/${organizationId}/billing/portal-session`,
      {},
      accessToken,
    );
  }
}

export function createBillingClient(baseUrl?: string): GenieBillingClient {
  return new GenieBillingClient(baseUrl ?? 'http://localhost:4000');
}
