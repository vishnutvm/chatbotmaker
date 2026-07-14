# AI Platform (Phase 4 — Unit 1)

**Status:** Shipped (platform API)  
**Last updated:** 2026-07-14

## Scope

Authenticated, organization-scoped chat completions behind an `AIProvider` abstraction:

- `POST /api/v1/organizations/:organizationId/ai/chat/completions`
- `POST /api/v1/organizations/:organizationId/ai/chat/completions/stream` (SSE)

See [docs/api/ai-chat.md](../api/ai-chat.md) and [AI_PLATFORM_ARCHITECTURE.md](../architecture/AI_PLATFORM_ARCHITECTURE.md).

## Not in this unit

| Deferred | Phase |
|----------|--------|
| Knowledge / RAG | 5 |
| Assistants CRUD + playground product UI | 6 |
| Widget public chat | 7 |
| Billing metering enforcement | 8 |

## Ops notes

- Requires `OPENAI_API_KEY` on the API; missing key → **503** `AI_NOT_CONFIGURED` (before SSE).
- Model is server-enforced (`AI_DEFAULT_MODEL`, default `gpt-4o-mini`).
- Usage stub rows land in `ai_usage_events` (no prompt/completion bodies).
