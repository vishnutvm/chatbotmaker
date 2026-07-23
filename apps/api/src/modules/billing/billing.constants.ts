import type { BillingPlanCatalogItem, BillingPlanKey } from '@genie/types';

export const PLAN_CATALOG: BillingPlanCatalogItem[] = [
  { key: 'free', name: 'Free', amountUsd: 0, interval: 'month' },
  { key: 'starter', name: 'Starter', amountUsd: 15, interval: 'month' },
  { key: 'pro', name: 'Pro', amountUsd: 49, interval: 'month' },
];

export const PAID_PLAN_KEYS = ['starter', 'pro'] as const satisfies ReadonlyArray<
  Exclude<BillingPlanKey, 'free'>
>;

export type PaidPlanKey = (typeof PAID_PLAN_KEYS)[number];
