# AI Platform Architecture (Phase 4 — Unit 1)

**Last Updated:** 2026-07-14  
**Status:** Implemented (Phase 4 Unit 1)  
**Roadmap:** Phase 4 — AI Platform Core  
**Contract:** [docs/api/ai-chat.md](../api/ai-chat.md)  
**ADR:** [docs/adr/0002-ai-provider-abstraction.md](../adr/0002-ai-provider-abstraction.md)

---

## Goal

Ship a tenant-scoped, authenticated chat completion API (JSON + SSE) behind an `AIProvider` abstraction. Unit 1 has **no** conversation persistence, assistants, RAG, playground UI, or client model selection.

---

## Layering

```text
HTTP (AiController)
    │  DTO validate only
    v
AiService  ──► OrganizationsService.requireMembership (make public / assertMember)
    │          PromptAssembler (system + messages, no RAG)
    │          ModelRouter.resolveChatModel() → AI_DEFAULT_MODEL only
    │          AiUsageRepository.create(...) best-effort
    v
AIProvider (token) ──► OpenAiProvider ──► OpenAI API
```

| Layer | Responsibility |
|-------|----------------|
| Controller | Auth guards, ParseUUIDPipe, DTO, map SSE vs JSON |
| AiService | Membership, assemble prompt, enforce token limits, call provider, usage stub |
| PromptAssembler | Pure message list construction |
| ModelRouter | U1: return default model string only |
| AiUsageRepository | Prisma insert into `ai_usage_events` |
| AIProvider / OpenAiProvider | Vendor I/O only |

**Hard rule:** Controllers and non-AI modules must not import `openai`.

---

## Module file list (implementation target)

```text
apps/api/src/infrastructure/ai/
  ai.interface.ts              # AIProvider, ChatParams, ChatResult, ChatStreamChunk, AI_PROVIDER
  openai.provider.ts           # OpenAiProvider implements AIProvider
  ai-infrastructure.module.ts  # @Global() bind AI_PROVIDER → OpenAiProvider

apps/api/src/modules/ai/
  ai.module.ts                 # imports OrganizationsModule, AiInfrastructureModule; controllers/providers
  ai.controller.ts             # POST .../chat/completions[+ /stream]
  ai.service.ts
  model-router.ts              # thin; default model from env
  prompt.assembler.ts
  ai-usage.repository.ts
  dto/
    chat-completion.dto.ts
```

Optional: keep `embed` on `AIProvider` unimplemented or throw `NotImplementedException` until Phase 5 — prefer a real embed method that works if OpenAI key is set, but **no HTTP route** for embed in U1.

---

## DI wiring

| Token / class | Provided by | Consumed by |
|---------------|-------------|-------------|
| `AI_PROVIDER` | `AiInfrastructureModule` (`useExisting: OpenAiProvider`) | `AiService` |
| `OpenAiProvider` | same | exported for tests |
| `OrganizationsService` | `OrganizationsModule` (export; **expose** `requireMembership` or `assertMember`) | `AiService` |
| `AiUsageRepository` | `AiModule` | `AiService` |
| `ModelRouter` | `AiModule` | `AiService` |
| Config getters | `env.ts` | `OpenAiProvider`, `ModelRouter` |

Suggested env getters (not yet present):

- `getOpenAiApiKey(): string | undefined`
- `getAiDefaultModel(): string` → `process.env.AI_DEFAULT_MODEL?.trim() || 'gpt-4o-mini'`

Register `AiModule` in `AppModule`.

### HTTP routes

| Method | Path |
|--------|------|
| POST | `/api/v1/organizations/:organizationId/ai/chat/completions` |
| POST | `/api/v1/organizations/:organizationId/ai/chat/completions/stream` |

Tenant id in **path** only (consistent with Organizations API).

---

## Data model — `ai_usage_events`

Cheap metering stub for Phase 8/9. No conversation rows.

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK → organizations | ON DELETE CASCADE |
| `user_id` | uuid FK → users | ON DELETE SET NULL or CASCADE |
| `provider` | text | e.g. `openai` |
| `model` | text | effective model |
| `operation` | text | `chat` \| `chat_stream` |
| `prompt_tokens` | int nullable | |
| `completion_tokens` | int nullable | |
| `total_tokens` | int nullable | |
| `latency_ms` | int nullable | wall time to completion / stream end |
| `status` | text | `success` \| `error` |
| `error_code` | text nullable | e.g. `AI_PROVIDER_ERROR` |
| `created_at` | timestamptz | default now() |

**Do not store** full prompts or completions in U1.

### Indexes

```text
@@index([organizationId, createdAt])   -- org usage / billing rollups
@@index([userId, createdAt])           -- per-user rate/debug
```

Optional later: `(organization_id, status, created_at)` if error analytics dominate.

Prisma model name: `AiUsageEvent` → `@@map("ai_usage_events")`. Document migration under `docs/database/` when implemented.

---

## Prompt assembly (U1)

```text
messages_out = []
if systemPrompt: messages_out += [{ role: "system", content: systemPrompt }]
messages_out += request.messages
→ AIProvider.chat|stream({ model, messages, maxTokens, temperature })
```

No knowledge retrieval, no assistant system prompt merge, no history reload.

Limits: see `docs/api/ai-chat.md` (maxTokens default 1024 / max 2048; message caps).

---

## ModelRouter (U1)

```text
resolveChatModel(_orgId?): string
  return getAiDefaultModel()  // gpt-4o-mini by default
```

Reject client `model` at DTO validation. Future: org plan → allowed models; still never take unverified client model as source of truth without allowlist.

---

## Security

- JWT + membership on every call
- Rate limits: 30/min/user, 60/min/org (in-memory OK for single Railway instance)
- No model override; cap maxTokens
- Redact secrets from logs; usage rows without prompt text
- 503 when key missing

## Performance

- ≤ 2 DB round-trips (membership + usage write)
- Stream: flush deltas; do not buffer full completion in memory before first byte
- Usage write must not fail the user-facing success path

## Cost

- Default `gpt-4o-mini`
- Default 1024 max tokens (hard cap 2048)
- Message count/length caps reduce token waste
- Single provider call per request (no retry storms without backoff policy)

---

## Out of scope

| Deferred | Phase |
|----------|--------|
| RAG / embeddings HTTP | 5 |
| Assistants CRUD | 6 |
| Widget public chat | 7 |
| Billing meters UI | 8–9 |
| Multi-provider routing | post-MVP |
| Conversation persistence / playground UI | later |

---

## Tech-lead gate checklist

- [x] Path tenant consistent with orgs
- [x] AIProvider in infrastructure; openai only in provider
- [x] Thin controller / fat service / repo for usage
- [x] Client cannot set model
- [x] No RAG / assistants / persistence in U1
- [x] Implementation + unit tests (stream + pre-SSE 503 covered)
- [x] Happy-path membership ≤ 1 DB round-trip (+ optional usage insert)
