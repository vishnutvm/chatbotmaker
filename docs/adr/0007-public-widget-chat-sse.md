# ADR 0007 — Public widget chat SSE with organization AiActor

- **Status:** accepted
- **Date:** 2026-07-23
- **Phase:** 7 — Widget (P0 live SSE)

## Context

The embeddable widget needs live assistant replies over the public API (publishable key, no JWT). Authenticated dashboard chat already streams via `AiService` with membership checks and per-user rate limits. Public visitors must not invent fake user UUIDs, must not persist conversations server-side in this slice, and must not share bootstrap rate-limit buckets with chat.

## Options

1. **Mint ephemeral / synthetic users** for widget sessions — pollutes auth identity, membership, and usage attribution.
2. **Bypass AiService** from the widget controller — violates AI layering (OpenAI only via AI module).
3. **Organization AiActor + public SSE** — key-authenticated org actor skips membership/user RL; usage `user_id` null; separate chat rate limits.

## Decision

- Expose `POST /api/v1/public/widget/chat/stream` (SSE) behind `PublishableKeyGuard`.
- Introduce `AiActor` (`member` | `organization`) on `AiService.prepare/complete/stream/embed`.
  - `member`: existing membership + `AiRateLimiter`; usage `userId` set.
  - `organization`: skip membership + skip `AiRateLimiter`; usage `userId` null (org from publishable key).
- Reuse assistant prompt assembly / RAG via `AssistantsService.streamLivePublicChat` (live + same-org only → 404 otherwise).
- No conversation persistence; client holds history in the request body.
- Chat rate limits separate from bootstrap: **20/key**, **40/org**, and **30/IP** per 60s (in-memory MVP); `Retry-After: 60` on 429.
- Resolve live assistant **before** chat rate-limit so 404 probes do not burn quota.
- Public `meta` SSE event is `{ model }` only (no `organizationId`).

## Consequences

- Usage metering attributes spend to the organization with null `user_id` for widget traffic.
- Open CORS + publishable keys remain mitigated by revoke + chat RL (domain allowlists later).
- Multi-instance rate limits deferred to Phase 10 Redis (same as bootstrap).
