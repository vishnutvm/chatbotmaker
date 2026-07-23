# Billing — org subscription (Stripe)

**Auth:** Supabase JWT (`Authorization: Bearer <access_token>`) on org routes  
**Webhook:** Stripe signature only (no JWT)  
**Base:** `/api/v1`  
**Tenant:** `:organizationId` route param + membership check (JWT has no org claim)  
**Phase:** 8 — Billing foundation (P0)

Plans: `free` (app default) · `starter` ($15/mo) · `pro` ($49/mo). Price IDs from env. TEST mode OK.

---

## Get subscription status

```http
GET /api/v1/organizations/:organizationId/billing/subscription
Authorization: Bearer <jwt>
```

**RBAC:** Any org member (read-only).

**200**

```json
{
  "organizationId": "uuid",
  "plan": "free",
  "status": "none",
  "cancelAtPeriodEnd": false,
  "currentPeriodEnd": null,
  "canCheckout": true,
  "canManageBilling": false,
  "plans": [
    { "key": "free", "name": "Free", "amountUsd": 0, "interval": "month" },
    { "key": "starter", "name": "Starter", "amountUsd": 15, "interval": "month" },
    { "key": "pro", "name": "Pro", "amountUsd": 49, "interval": "month" }
  ]
}
```

| Field | Notes |
|-------|--------|
| `plan` | `free` \| `starter` \| `pro` |
| `status` | `none` \| `active` \| `trialing` \| `past_due` \| `canceled` \| `incomplete` \| `incomplete_expired` \| `unpaid` |
| `canCheckout` | `true` when caller is owner/admin and Stripe is configured |
| `canManageBilling` | `true` when caller is owner/admin and org has a Stripe customer |

| Status | When |
|--------|------|
| 401 | Missing/invalid JWT |
| 403 | Not a member |
| 404 | Organization not found |

**Performance:** p95 &lt; 200ms · ≤ 2 DB reads · **no** Stripe HTTP call.

---

## Create Checkout session

```http
POST /api/v1/organizations/:organizationId/billing/checkout-session
Authorization: Bearer <jwt>
Content-Type: application/json

{ "plan": "starter" }
```

`plan` required: `starter` \| `pro` only (reject `free`).

**201**

```json
{ "url": "https://checkout.stripe.com/c/pay/..." }
```

| Status | When |
|--------|------|
| 400 | Invalid plan, Free requested, already on that paid plan, or Stripe misconfigured |
| 401 | Missing/invalid JWT |
| 403 | Not owner/admin |
| 404 | Organization not found / not a member |
| 429 | Rate limited |
| 503 | Stripe not configured (`STRIPE_SECRET_KEY` / price IDs missing) |
| 502 | Stripe upstream failure |

**Rules:**

- Lazy-create Stripe Customer per org (`metadata.organizationId`)
- Success/cancel URLs from env (`STRIPE_CHECKOUT_SUCCESS_URL`, `STRIPE_CHECKOUT_CANCEL_URL`)
- Do **not** set `organizations.plan` from this endpoint — webhooks are source of paid truth

**Performance:** p95 &lt; 1.5s · ≤ 2 DB + 1–2 Stripe calls  
**Rate limit:** 10/min per user+org (MVP in-memory)

---

## Create Customer Portal session

```http
POST /api/v1/organizations/:organizationId/billing/portal-session
Authorization: Bearer <jwt>
Content-Type: application/json

{}
```

**201**

```json
{ "url": "https://billing.stripe.com/p/session/..." }
```

| Status | When |
|--------|------|
| 400 | No Stripe customer (still Free / never checked out) |
| 401 | Missing/invalid JWT |
| 403 | Not owner/admin |
| 404 | Organization not found / not a member |
| 429 | Rate limited |
| 503 | Stripe not configured |
| 502 | Stripe upstream failure |

**Performance:** p95 &lt; 1.5s  
**Rate limit:** 10/min per user+org

---

## Stripe webhook

```http
POST /api/v1/webhooks/stripe
Stripe-Signature: <sig>
Content-Type: application/json

<raw body>
```

**Auth:** `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)` — no JWT.

**200**

```json
{ "received": true }
```

(Including duplicate `event.id` — idempotent no-op.)

| Status | When |
|--------|------|
| 400 | Invalid signature / missing raw body |
| 500 | Processing failure (Stripe retries) |

**Handled events:** `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

**Idempotency:** unique `stripe_webhook_events.event_id`. If the row exists and `processed_at` is set → no-op 200. If the row exists but `processed_at` is null (prior apply failure) → re-apply on Stripe retry, then mark processed.

**Performance:** p95 &lt; 500ms

---

## Validation

- Reject unknown body fields (`whitelist: true`)
- `organizationId` must be UUID
- Never trust client-supplied Stripe customer/subscription IDs
- Tenant isolation: all DB queries filter by `organizationId` from route (after membership)

## Security

- Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs — env only; never logged
- Plan paid state written only by webhook handler (plus Free default on org create)
- Success/cancel/portal return URLs must be allowlisted app origins

## Env

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature |
| `STRIPE_PRICE_STARTER` | Starter price ID |
| `STRIPE_PRICE_PRO` | Pro price ID |
| `STRIPE_CHECKOUT_SUCCESS_URL` | e.g. `{WEB}/dashboard/billing?billing=success&session_id={CHECKOUT_SESSION_ID}` |
| `STRIPE_CHECKOUT_CANCEL_URL` | e.g. `{WEB}/dashboard/billing?billing=cancel` |
| `STRIPE_PORTAL_RETURN_URL` | e.g. `{WEB}/dashboard/billing` |
