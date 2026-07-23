# ADR 0004 — Publishable API keys (`pk_live`) for widget auth

- **Status:** accepted
- **Date:** 2026-07-22
- **Phase:** 7 — Widget

## Context

The embeddable widget accepts `apiKey` + `assistantId` but previously only validated presence. Third-party pages need a **publishable** credential that resolves tenant safely without a user JWT, without exposing dashboard power.

## Options

1. **JWT-in-embed** — impractical for anonymous visitors on customer sites.
2. **Assistant-scoped secrets** — awkward rotation; marketing/embed contract is org key + assistant id.
3. **Org-scoped `pk_live` + public bootstrap** — Stripe-like publishable key; hash stored server-side.

## Decision

- Issue **org-scoped** keys with prefix `pk_live_`.
- Store **HMAC-SHA256(pepper, rawKey)** with unique index for O(1) lookup (not scrypt — wrong for high-entropy secrets + hash lookup).
- Authenticated owner/admin create / list / revoke; plaintext once at create.
- Public `GET /api/v1/public/widget/bootstrap` validates key + **live** same-org assistant; returns display config only.
- Path-aware open CORS on `/public/**` only.
- In-memory per-key rate limit (MVP).

## Consequences

- Keys will appear in page source — treat as publishable; support revoke/rotation.
- No domain allowlist in this slice (accepted risk until later P7/P10 hardening).
- Chat/SSE over public API: see ADR 0007 (`POST /api/v1/public/widget/chat/stream`).
