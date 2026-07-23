'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopHeader } from '@/components/shell/TopHeader';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { createBillingClient } from '@genie/api-client';
import type {
  BillingPlanKey,
  BillingSubscriptionResponse,
  BillingSubscriptionStatus,
} from '@genie/types';
import { getAccessToken, getApiBaseUrl } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';
import { Check, Loader2, RefreshCw } from 'lucide-react';

const PLAN_FEATURES: Record<BillingPlanKey, string[]> = {
  free: ['1 assistant', 'Community support', 'Core dashboard'],
  starter: ['Multiple assistants', 'Priority support', 'Checkout-ready billing'],
  pro: ['Higher capacity', 'Portal plan management', 'Team-ready billing'],
};

function planLabel(plan: BillingPlanKey): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function statusTone(
  status: BillingSubscriptionStatus,
): 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'success';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
      return 'warning';
    case 'canceled':
    case 'incomplete_expired':
      return 'error';
    default:
      return 'neutral';
  }
}

function formatPeriodEnd(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export default function Billing() {
  const { activeOrg } = useAuth();
  const searchParams = useSearchParams();
  const billingFlag = searchParams.get('billing');

  const [data, setData] = useState<BillingSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'checkout' | 'portal' | null>(null);

  const load = useCallback(async () => {
    if (!activeOrg?.id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Not signed in');
      }
      const client = createBillingClient(getApiBaseUrl());
      const subscription = await client.getSubscription(token, activeOrg.id);
      setData(subscription);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (billingFlag === 'success') {
      toast.message('Subscription updating…', {
        description: 'Stripe may take a moment. Refreshing plan status.',
      });
      void load();
    } else if (billingFlag === 'cancel') {
      toast.message('Checkout canceled');
    }
  }, [billingFlag, load]);

  const periodEndLabel = useMemo(
    () => formatPeriodEnd(data?.currentPeriodEnd ?? null),
    [data?.currentPeriodEnd],
  );

  async function startCheckout(plan: 'starter' | 'pro') {
    if (!activeOrg?.id) return;
    setActionLoading('checkout');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createBillingClient(getApiBaseUrl());
      const { url } = await client.createCheckoutSession(token, activeOrg.id, { plan });
      window.location.assign(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start checkout');
      setActionLoading(null);
    }
  }

  async function openPortal() {
    if (!activeOrg?.id) return;
    setActionLoading('portal');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not signed in');
      const client = createBillingClient(getApiBaseUrl());
      const { url } = await client.createPortalSession(token, activeOrg.id);
      window.location.assign(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open billing portal');
      setActionLoading(null);
    }
  }

  return (
    <>
      <TopHeader breadcrumb={<span className="text-foreground">Billing</span>} />
      <div className="mx-auto max-w-[1080px] px-6 py-8 space-y-6">
        <PageHeader
          title="Billing"
          description="View your plan and upgrade when you are ready."
        />

        {!activeOrg ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
            Select or create an organization to manage billing.
          </div>
        ) : null}

        {activeOrg && loading ? (
          <div className="rounded-xl border border-border bg-surface p-6 space-y-4 animate-pulse">
            <div className="h-6 w-40 rounded bg-surface-muted" />
            <div className="h-4 w-64 rounded bg-surface-muted" />
            <div className="h-10 w-48 rounded bg-surface-muted" />
          </div>
        ) : null}

        {activeOrg && error ? (
          <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
            <p className="text-sm text-foreground">{error}</p>
            <Button variant="outline" onClick={() => void load()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : null}

        {activeOrg && !loading && !error && data ? (
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">
                    {planLabel(data.plan)}
                  </span>
                  <StatusBadge tone="primary">Current plan</StatusBadge>
                  {data.status !== 'none' ? (
                    <StatusBadge tone={statusTone(data.status)}>{data.status}</StatusBadge>
                  ) : null}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {data.plan === 'free'
                    ? 'Free plan — upgrade anytime for more capacity.'
                    : periodEndLabel
                      ? data.cancelAtPeriodEnd
                        ? `Cancels at period end · ${periodEndLabel}`
                        : `Current period ends ${periodEndLabel}`
                      : 'Paid subscription active.'}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.canManageBilling ? (
                  <Button
                    variant="outline"
                    disabled={actionLoading !== null}
                    onClick={() => void openPortal()}
                  >
                    {actionLoading === 'portal' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Manage billing'
                    )}
                  </Button>
                ) : null}
                {data.canCheckout && data.plan === 'free' ? (
                  <Button
                    disabled={actionLoading !== null}
                    onClick={() => void startCheckout('starter')}
                  >
                    {actionLoading === 'checkout' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Upgrade'
                    )}
                  </Button>
                ) : null}
                {data.canCheckout && data.plan === 'starter' ? (
                  <Button
                    disabled={actionLoading !== null}
                    onClick={() => void startCheckout('pro')}
                  >
                    Upgrade to Pro
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {activeOrg && !loading && !error && data ? (
          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="text-base font-semibold text-foreground">Compare plans</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {data.plans.map((plan) => {
                const isCurrent = plan.key === data.plan;
                const features = PLAN_FEATURES[plan.key];
                const priceLabel =
                  plan.amountUsd === 0 ? '$0' : `$${plan.amountUsd}`;
                const showUpgrade =
                  data.canCheckout &&
                  !isCurrent &&
                  (plan.key === 'starter' || plan.key === 'pro') &&
                  (data.plan === 'free' ||
                    (data.plan === 'starter' && plan.key === 'pro'));

                return (
                  <div
                    key={plan.key}
                    className={`rounded-lg border p-5 ${
                      isCurrent ? 'border-primary ring-1 ring-primary' : 'border-border'
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground">{plan.name}</div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                      {priceLabel}
                      <span className="text-sm font-normal text-muted-foreground">
                        {' '}
                        / month
                      </span>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-sm text-foreground">
                      {features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-success" /> {f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button className="mt-5 w-full" variant="outline" disabled>
                        Current plan
                      </Button>
                    ) : showUpgrade ? (
                      <Button
                        className="mt-5 w-full"
                        disabled={actionLoading !== null}
                        onClick={() => void startCheckout(plan.key as 'starter' | 'pro')}
                      >
                        Upgrade
                      </Button>
                    ) : (
                      <Button className="mt-5 w-full" variant="outline" disabled>
                        {plan.key === 'free' ? 'Included' : 'Contact admin'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
