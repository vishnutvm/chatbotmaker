# AI Chat Completions API (Phase 4 — Unit 1)

Authenticated organization-scoped chat completions via the NestJS AI service layer. No conversation persistence, no assistants, no RAG, no client model selection.

**Base path:** `/api/v1`  
**Module:** `apps/api/src/modules/ai/`  
**Contract version:** 1.0 (U1)

---

## Tenant & path convention

Organization id is a **path parameter**, consistent with Organizations API (`/api/v1/organizations/:organizationId/...`).

| Field | Location | Rules |
|-------|----------|--------|
| `organizationId` | path | UUID; required; membership verified server-side |

Do **not** accept `organizationId` in the body. Ignore or reject duplicate tenant fields if present.

---

## Auth

| Requirement | Detail |
|-------------|--------|
| Scheme | `Authorization: Bearer <Supabase access_token>` |
| Guard | `SupabaseJwtGuard` |
| User | `@CurrentUser()` → onboarded application user |
| Tenant | `OrganizationsService.requireMembership(userId, organizationId)` |
| Roles (U1) | Any membership role: `owner` \| `admin` \| `member` |

---

## POST /api/v1/organizations/:organizationId/ai/chat/completions

Non-streaming completion. Returns a single JSON body.

### Request

- **Content-Type:** `application/json`
- **Auth:** Bearer JWT + org membership

```json
{
  "systemPrompt": "You are a helpful assistant for Acme support.",
  "messages": [
    { "role": "user", "content": "What are your hours?" }
  ],
  "maxTokens": 1024,
  "temperature": 0.7
}
```

| Field | Type | Required | Rules |
|-------|------|----------|--------|
| `systemPrompt` | string | no | 1–8000 chars when present; assembled as a leading `system` message |
| `messages` | array | yes | 1–50 items; see message object |
| `messages[].role` | string | yes | `user` \| `assistant` \| `system` |
| `messages[].content` | string | yes | 1–32000 chars per message |
| `maxTokens` | integer | no | Default **1024**; min 1; max **2048** |
| `temperature` | number | no | 0–2 inclusive; provider default if omitted |

**Forbidden (U1):** `model`, `stream`, `tools`, `tool_choice`, `assistantId`, `conversationId`, `knowledgeBaseId`, and any other undeclared fields.

- Reject unknown properties (`forbidNonWhitelisted`).
- If `model` is sent → **400** with field error (client cannot override; server uses `AI_DEFAULT_MODEL`).

### Response `200`

```json
{
  "id": "chatcmpl_01HXYZ...",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "model": "gpt-4o-mini",
  "content": "We are open Monday–Friday, 9am–5pm ET.",
  "finishReason": "stop",
  "usage": {
    "promptTokens": 42,
    "completionTokens": 18,
    "totalTokens": 60
  }
}
```

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | Provider completion id when available; otherwise server-generated UUID prefixed `chatcmpl_` |
| `organizationId` | uuid | Echo of path tenant |
| `model` | string | Effective model (`AI_DEFAULT_MODEL`) |
| `content` | string | Assistant text (empty string if provider returned none) |
| `finishReason` | string \| null | `stop` \| `length` \| `content_filter` \| provider value \| `null` |
| `usage.promptTokens` | integer \| null | Null if provider omitted usage |
| `usage.completionTokens` | integer \| null | |
| `usage.totalTokens` | integer \| null | |

---

## POST /api/v1/organizations/:organizationId/ai/chat/completions/stream

SSE streaming completion. Same auth and body rules as the JSON endpoint, except `stream` is implied by the path (still **do not** accept a `stream` body field).

### Request

Identical body schema to the non-stream endpoint (no `stream` field).

### Response headers

| Header | Value |
|--------|--------|
| `Content-Type` | `text/event-stream` |
| `Cache-Control` | `no-cache` |
| `Connection` | `keep-alive` |
| `X-Accel-Buffering` | `no` (hint for reverse proxies) |

### SSE event format

Each event is one SSE block: optional `event:` line, required `data:` line (JSON), blank line terminator.

```text
event: meta
data: {"organizationId":"550e8400-e29b-41d4-a716-446655440000","model":"gpt-4o-mini"}

event: delta
data: {"content":"We are open "}

event: delta
data: {"content":"Monday–Friday."}

event: done
data: {"finishReason":"stop","usage":{"promptTokens":42,"completionTokens":18,"totalTokens":60}}

event: error
data: {"statusCode":502,"code":"AI_PROVIDER_ERROR","message":"Upstream model request failed"}
```

| Event | When | `data` payload |
|-------|------|----------------|
| `meta` | Once at start (after auth + prompt assembly) | `{ organizationId, model }` |
| `delta` | Zero or more | `{ content: string }` — incremental text chunk |
| `done` | Once on success | `{ finishReason, usage }` — same usage shape as JSON response |
| `error` | Terminal failure after headers sent | `{ statusCode, code, message }` |

**Client rules:**

1. Consume until `done` or `error`.
2. Concatenate all `delta.content` values for full assistant text.
3. If the connection drops before `done`/`error`, treat as incomplete (no retry contract in U1).

**Server rules:**

- Do not emit `delta` after `done` or `error`.
- Prefer emitting `error` event over abrupt close when the failure occurs mid-stream.
- Pre-stream failures (auth, validation, membership) use normal HTTP status JSON (below), not SSE.

---

## Errors (both endpoints)

Standard NestJS-style JSON unless SSE has already started.

```json
{
  "statusCode": 400,
  "message": ["model should not exist"],
  "error": "Bad Request"
}
```

| Status | Code / when |
|--------|-------------|
| 400 | Validation failed; unknown fields; `model` supplied; empty `messages`; `maxTokens` out of range |
| 401 | Missing/invalid JWT or user not onboarded |
| 403 | Authenticated but not a member of `organizationId` |
| 404 | Organization does not exist |
| 429 | Rate limited (per-user and/or per-org; see security) |
| 502 | Upstream AI provider failure (`AI_PROVIDER_ERROR`) |
| 503 | AI misconfigured (`OPENAI_API_KEY` unset) (`AI_NOT_CONFIGURED`) |

For stream path: 401/403/404/400/429/503 occur **before** SSE headers. 502 may be either pre-stream JSON or mid-stream `event: error`.

---

## Validation summary

- Reject unknown fields
- Cap message count (50) and per-message length (32k chars)
- Cap `systemPrompt` (8k chars)
- Cap total assembled input (implementation may enforce ~100k chars soft limit → 400)
- `maxTokens`: default 1024, max 2048
- Sanitize: trim roles; reject empty content strings
- Never log raw prompts/completions containing secrets or full PII in production logs (log ids, token counts, latency only)

---

## Server-side behavior (non-contract implementation notes)

| Concern | U1 behavior |
|---------|-------------|
| Model | Always `process.env.AI_DEFAULT_MODEL` (default `gpt-4o-mini`); client cannot set |
| Prompt assembly | Optional `systemPrompt` + `messages` → provider chat messages; **no RAG injection** |
| Persistence | None (no conversations/messages tables) |
| Usage | Best-effort insert into `ai_usage_events` (must not fail the user response if logging fails) |
| Embeddings | Not exposed over HTTP in U1 |

---

## Performance targets

| Metric | Target |
|--------|--------|
| Pre-provider work (auth + membership + validate + prompt assemble) | p95 &lt; 100ms |
| Time to first SSE `delta` | Dominated by OpenAI; app overhead p95 &lt; 150ms after provider first token |
| Non-stream JSON | Dominated by OpenAI; app overhead p95 &lt; 100ms excluding provider |
| DB queries per request | ≤ 2 (membership lookup + optional usage insert) |
| Usage insert | Async/fire-and-forget preferred; never block streaming hot path longer than necessary |

---

## Security

- Tenant isolation: membership check on every request; never trust client org id alone
- Rate limit (MVP): **30 req/min per user** and **60 req/min per organization** on both chat endpoints (recommend Redis later; in-memory acceptable for single-instance Railway MVP)
- Do not return upstream API keys or raw OpenAI error bodies with sensitive details
- Audit: usage events carry `organization_id`, `user_id`, model, tokens, status — not full prompt text in U1

---

## Out of scope (U1)

- Assistants CRUD / `assistantId` (Phase 6)
- Knowledge / RAG context injection (Phase 5)
- Conversation history persistence
- Playground UI / dashboard chat page
- Client-selected models, tool calling, vision, embeddings HTTP API
- Billing meter reconciliation (usage table is a stub for Phase 8/9)

---

## Env (API)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | yes (for live calls) | — | OpenAI provider credentials |
| `AI_DEFAULT_MODEL` | no | `gpt-4o-mini` | Server-enforced chat model |
