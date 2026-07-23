# Billing — organization subscriptions

**Phase:** 8 · **Migration:** `organization_subscriptions` + `stripe_webhook_events`  
**Related:** [ADR 0008](../adr/0008-stripe-org-subscriptions.md) · [API contract](../api/billing.md)

## Tables

### `organization_subscriptions`

1:1 with `organizations`. Created lazily on first Checkout (or on first webhook bind).

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid UNIQUE FK CASCADE | Tenant |
| `stripe_customer_id` | text UNIQUE NULL | |
| `stripe_subscription_id` | text UNIQUE NULL | |
| `stripe_price_id` | text NULL | |
| `plan` | text NOT NULL DEFAULT `free` | `free` \| `starter` \| `pro` |
| `status` | text NOT NULL DEFAULT `none` | Stripe-like status |
| `cancel_at_period_end` | boolean NOT NULL DEFAULT false | |
| `current_period_start` | timestamptz NULL | |
| `current_period_end` | timestamptz NULL | |
| `created_at` / `updated_at` | timestamptz | |

**Indexes:** unique on `organization_id`, `stripe_customer_id`, `stripe_subscription_id`.

### `stripe_webhook_events`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | text UNIQUE | Stripe `event.id` |
| `type` | text | Event type |
| `processed_at` | timestamptz NULL | Set when apply succeeds |
| `created_at` | timestamptz | |

### Unchanged

`organizations.plan` — denormalized cache; webhook sync keeps it aligned with `organization_subscriptions.plan`.

## Migration / rollback

1. `prisma migrate` adds both tables (no backfill — all orgs already `plan=free`).
2. Rollback: drop `organization_subscriptions` and `stripe_webhook_events`; leave `organizations.plan`.

## Query patterns

- Status GET: by `organization_id` (≤ 1 row).
- Webhook: by `stripe_customer_id` or `stripe_subscription_id` or metadata `organizationId`.
- Idempotency: insert/lookup by `event_id`.
