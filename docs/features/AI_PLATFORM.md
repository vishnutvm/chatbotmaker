# AI Platform (Phase 4 — Unit 1)

**Status:** Done — live on Railway (2026-07-15)  
**Last updated:** 2026-07-15  
**Ship:** [PR #2](https://github.com/vishnutvm/chatbotmaker/pull/2) → `master` (`5ab7e05`)

## Scope (delivered)

Authenticated, organization-scoped chat completions behind an `AIProvider` abstraction:

| Method | Path |
|--------|------|
| POST | `/api/v1/organizations/:organizationId/ai/chat/completions` |
| POST | `/api/v1/organizations/:organizationId/ai/chat/completions/stream` (SSE) |

Live check (no JWT): both routes return **401 Unauthorized** (not 404).

See:

- Contract — [docs/api/ai-chat.md](../api/ai-chat.md)
- Architecture — [docs/architecture/AI_PLATFORM_ARCHITECTURE.md](../architecture/AI_PLATFORM_ARCHITECTURE.md)
- ADR — [docs/adr/0002-ai-provider-abstraction.md](../adr/0002-ai-provider-abstraction.md)

## Code map

```text
apps/api/src/infrastructure/ai/     # AIProvider + OpenAiProvider
apps/api/src/modules/ai/            # controller, service, prompt, usage, rate limit
packages/types/src/ai-chat.ts
packages/api-client/src/ai.ts       # complete() — stream client deferred
```

## Ops

| Variable | Required | Notes |
|----------|----------|--------|
| `OPENAI_API_KEY` | yes for live model calls | Missing → **503** `AI_NOT_CONFIGURED` before SSE |
| `AI_DEFAULT_MODEL` | no | Default `gpt-4o-mini`; clients cannot override |

Usage stub: `ai_usage_events` (tokens/latency/status — no prompt bodies).

## Not in this unit

| Deferred | Phase |
|----------|--------|
| Knowledge / RAG | 5 |
| Assistants CRUD + playground product UI | 6 |
| Widget public chat | 7 |
| Billing metering enforcement | 8 |
