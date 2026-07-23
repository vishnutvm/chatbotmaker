# ADR 0008: Stripe org subscriptions

**Status:** Accepted  
**Date:** 2026-07-23  
**Deciders:** Product Owner, Solution Architect, Tech Lead  
**Phase:** 8 — Billing (P0 foundation)

---

## Context

Genie needs paid plans (Starter $15/mo, Pro $49/mo) with Checkout and Customer Portal before usage-limit enforcement. Organizations already have a denormalized `plan` string defaulting to `free`. There is no Stripe module, no subscription table, and the dashboard billing page is mock data.

Infrastructure rules: never tightly couple business logic to Stripe; keep controllers thin; tenant = organization.

---

## Problem

1. Where to store Stripe customer/subscription state without coupling org CRUD to billing lifecycle.
2. How Free relates to Stripe (Checkout for $0 vs app default).
3. How to keep `organizations.plan` (used by org APIs) consistent with Stripe without trusting the browser.
4. How to isolate the Stripe SDK for testability and future provider swap.

---

## Options considered

| Option | Summary | Pros | Cons |
|--------|---------|------|------|
| **A. Stripe fields on `organizations`** | customer/sub IDs on org row | Fewer tables | Couples org to billing; messy lifecycle |
| **B. Separate `organization_subscriptions` + denormalized `organizations.plan` (chosen)** | 1:1 subscription row; sync plan on webhook | Clean layering; cheap org list reads | Two writes on sync |
| **C. Drop `organizations.plan`; subscription table only** | Single source | Pure | Breaks existing org DTOs this sprint |

| Free model | Verdict |
|------------|---------|
| Stripe $0 Checkout product | Extra Customer noise; not needed |
| **App-side Free default (chosen)** | No Customer until first paid Checkout |

| Provider coupling | Verdict |
|-------------------|---------|
| Stripe SDK in `BillingService` | Fast but vendor-locked |
| **`PaymentProvider` interface + Stripe adapter (chosen)** | Matches AI/Storage pattern |

---

## Decision

1. **Customer-per-organization** — lazy-create on first Checkout; `metadata.organizationId`.
2. **Free is app-default** — no Checkout for Free; missing subscription row ⇒ Free / `status: none`.
3. **Table `organization_subscriptions`** (1:1 org) holds Stripe IDs, status, period, plan key.
4. **`organizations.plan`** remains denormalized cache; updated **only** by billing webhook sync (and org-create default `free`).
5. **`PaymentProvider`** in `apps/api/src/infrastructure/billing/`; Stripe SDK only in the adapter.
6. **Webhooks** are source of truth for paid state: signed, idempotent via `stripe_webhook_events.event_id`.
7. **RBAC:** owner/admin for Checkout/Portal; any member may read status.
8. **Out of scope for this ADR:** usage rollups, limits middleware, soft-paywall.

---

## Consequences

### Positive

- Clear tenant billing boundary; testable without live Stripe in unit tests.
- Org list/detail keep cheap `plan` reads.
- Portal handles post-purchase plan changes without custom proration UI.

### Negative / trade-offs

- Dual write (`subscription` + `organizations.plan`) must stay in one transactional path.
- Brief lag after Checkout success until webhook lands (UI refetch + banner).
- Price catalog is env-mapped (no Products table) — fine for three plans.

### Follow-ups

- Phase 8 later: usage rollups + limit enforcement reading `organizations.plan` / subscription status.
- Optional short TTL cache on GET status if load warrants (not P0).
