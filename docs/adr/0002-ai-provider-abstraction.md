# ADR 0002: AI Provider Abstraction

**Status:** Accepted  
**Date:** 2026-07-14  
**Deciders:** Product Owner, Solution Architect, Tech Lead  
**Phase:** 4 — AI Platform Core (Unit 1)

---

## Context

Genie must call large language models for chat completions (Phase 4), embeddings for RAG (Phase 5), and later assistant/workflow flows (Phase 6+). The MVP uses **OpenAI**, but the infrastructure blueprint and TECHNICAL_ARCHITECTURE require that business code never couple to the OpenAI SDK.

Controllers already stay thin; storage and cache live behind Nest DI tokens in `apps/api/src/infrastructure/`. AI must follow the same pattern.

---

## Problem

1. **Vendor lock-in** — Importing `openai` from controllers or domain services would hard-wire Genie to one SDK and response shapes.
2. **Layering** — Business rules (tenant membership, prompt assembly, usage logging, max tokens) must live in the AI module services, not in HTTP or vendor code.
3. **Streaming** — Chat needs both JSON completions and SSE streaming; the abstraction must support sync and async-iterable token streams without leaking OpenAI chunk formats to controllers.
4. **Cost & control** — Unit 1 forbids client model selection; the platform must enforce `AI_DEFAULT_MODEL` centrally.
5. **Forward path** — Phase 5 needs `embed()` on the same abstraction; Phase 8/9 need usage events for billing/analytics.

---

## Options considered

| Option | Summary | Pros | Cons |
|--------|---------|------|------|
| **A. Direct OpenAI in AI service** | `openai` package only inside `AiService` | Fastest U1 | Controllers-safe but domain still vendor-coupled; hard to swap/test |
| **B. AIProvider interface + OpenAI impl (chosen)** | Token `AI_PROVIDER` in infrastructure; module orchestrates | Matches Storage/Cache; testable; swap path clear | Slightly more files |
| **C. Multi-provider ModelRouter first** | Full routing (OpenAI + Anthropic + fallbacks) in U1 | Future-ready | Over-engineering for MVP; unused cost |

---

## Decision

**Adopt Option B** for Phase 4 Unit 1:

1. Define `AIProvider` in `apps/api/src/infrastructure/ai/` with at least:
   - `chat(params): Promise<ChatResult>`
   - `stream(params): AsyncIterable<ChatStreamChunk>`
   - `embed(text | texts): Promise<number[] | number[][]>` (implemented stub-ready for Phase 5; not exposed via HTTP in U1)
2. Bind `OpenAiProvider` via Nest DI symbol `AI_PROVIDER` (mirror `STORAGE_PROVIDER` / cache).
3. Domain module `apps/api/src/modules/ai/`:
   - Thin controller(s) under org path
   - `AiService` — membership, validation, prompt assembly, invoke provider, usage stub
   - Optional thin `ModelRouter` — U1 returns only `AI_DEFAULT_MODEL`; no client override
   - `AiUsageRepository` — Prisma writes to `ai_usage_events`
4. **Never** import `openai` from controllers, other domain modules, or frontends.
5. Env: `OPENAI_API_KEY` required for live calls; `AI_DEFAULT_MODEL` default `gpt-4o-mini`.

### Interface sketch (normative for implementers)

```typescript
interface AIProvider {
  chat(params: ChatParams): Promise<ChatResult>;
  stream(params: ChatParams): AsyncIterable<ChatStreamChunk>;
  embed(input: string | string[]): Promise<number[] | number[][]>;
}

// ChatParams includes messages, model, maxTokens, temperature — model is set by ModelRouter/AiService, not the client.
```

Controllers map HTTP ↔ DTO only; they do not call `AIProvider` directly if that would skip membership/prompt/usage — prefer `AiService` as the sole HTTP-facing orchestrator.

---

## Consequences

### Positive

- Controllers and future RAG/assistant services depend on a stable port.
- Unit tests mock `AI_PROVIDER` without network.
- OpenAI → alternate provider is a new class + module binding change.
- Aligns with ADR 0001 abstraction boundary language and infrastructure blueprint.
- Usage events table gives cheap metering for later billing without conversation persistence.

### Negative

- Extra indirection vs calling OpenAI inline.
- Stream chunk mapping must be maintained when OpenAI protocol changes.
- `embed` on the interface before Phase 5 HTTP/API may tempt premature use (mitigate: no public embed endpoint in U1).

### Neutral

- U1 `ModelRouter` is intentionally minimal (single default model).
- Multi-provider routing deferred until product needs it.

---

## Trade-offs

| Keep | Defer |
|------|-------|
| Single OpenAI implementation | Anthropic/Azure/OpenRouter adapters |
| Server-enforced default model | Per-org model policies |
| Usage event stub (tokens + latency) | Stripe meter sync, quotas UI |
| Prompt assembly without RAG | Knowledge context injection (Phase 5) |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Abstraction leaks OpenAI types into domain | Medium | Medium | Keep ChatParams/ChatResult in infrastructure or shared types; map in provider |
| Usage insert adds latency | Low | Medium | Fire-and-forget / try-catch; never fail chat on log error |
| Key missing in Railway | Medium | High | Fail fast 503 `AI_NOT_CONFIGURED`; startup snapshot already tracks key presence |
| SSE buffering on proxies | Medium | Medium | `X-Accel-Buffering: no`; document Railway/Cloudflare behavior |

---

## Related

- API contract: `docs/api/ai-chat.md`
- Architecture: `docs/architecture/AI_PLATFORM_ARCHITECTURE.md`
- Prior: ADR 0001 (Supabase + AIProvider mentioned as future boundary)
