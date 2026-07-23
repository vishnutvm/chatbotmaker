# Billing

**Phase:** 8 · **Status:** Foundation (P0)  
**ADR:** [0008 — Stripe org subscriptions](../adr/0008-stripe-org-subscriptions.md)  
**API:** [billing.md](../api/billing.md)  
**Schema:** [billing-subscription.md](../database/billing-subscription.md)

## What this delivers

- Stripe plans: **Free** (app default), **Starter** ($15/mo), **Pro** ($49/mo)
- Org-scoped subscription state with tenant isolation
- Checkout + Customer Portal session APIs (owner/admin)
- Signed, idempotent Stripe webhooks
- Dashboard `/dashboard/billing` wired to real plan/status

## What is not included yet

- Usage rollups / Stripe meter sync
- Limits middleware on AI / widget / assistants
- Soft-paywall beyond billing-page CTAs

## Plans

| Key | Price | Stripe |
|-----|-------|--------|
| `free` | $0 | No Checkout; default when no paid sub |
| `starter` | $15/mo | `STRIPE_PRICE_STARTER` |
| `pro` | $49/mo | `STRIPE_PRICE_PRO` |

## Architecture (summary)

- **Customer-per-org** (lazy on first Checkout)
- **`PaymentProvider`** abstraction — Stripe SDK only in infrastructure adapter
- **Webhooks** update `organization_subscriptions` and sync `organizations.plan`
- Dashboard never trusts redirect query params to set plan — refetch after success

## Env vars

See [API contract](../api/billing.md#env). Local/CI may omit Stripe; Checkout/Portal return **503** when not configured. Free status still works from DB defaults.

## Local webhook testing

```bash
stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
```

## Dashboard states

| State | Behavior |
|-------|----------|
| Loading | Skeleton |
| Error | Message + retry |
| Free | Plan Free + Upgrade CTAs (managers) |
| Active paid | Plan + status + Manage billing (Portal) |
| Member | Read-only (no Checkout/Portal CTAs) |
| `?billing=success` | Banner + refetch (webhook lag) |
| `?billing=cancel` | Soft cancel message |
