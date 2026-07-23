export type BillingPlanKey = 'free' | 'starter' | 'pro';

export type BillingSubscriptionStatus =
  | 'none'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface BillingPlanCatalogItem {
  key: BillingPlanKey;
  name: string;
  amountUsd: number;
  interval: 'month';
}

export interface BillingSubscriptionResponse {
  organizationId: string;
  plan: BillingPlanKey;
  status: BillingSubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  canCheckout: boolean;
  canManageBilling: boolean;
  plans: BillingPlanCatalogItem[];
}

export interface CreateCheckoutSessionRequest {
  plan: 'starter' | 'pro';
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}
