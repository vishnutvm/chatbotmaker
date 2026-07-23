# Public widget chat stream (SSE)

**Auth:** Publishable key (`pk_live_…`) — **no JWT**  
**Base:** `/api/v1/public`  
**Phase:** 7 (Widget) P0

Streams live assistant replies for the embeddable widget. Prompt assembly and RAG match authenticated `POST …/assistants/:id/chat` (with public-specific history hardening). SSE event shapes match AI U1 (`docs/api/ai-chat.md`) except public `meta` omits `organizationId`.

## Chat stream

```http
POST /api/v1/public/widget/chat/stream
Content-Type: application/json
Accept: text/event-stream
X-Genie-Public-Key: pk_live_…
```

Alternate header (also accepted):

```http
Authorization: Bearer pk_live_…
```

**Never** put the key in the query string (rejected with **400**).

### Request body

```json
{
  "assistantId": "<uuid>",
  "messages": [
    { "role": "user", "content": "What are your hours?" }
  ]
}
```

| Field | Rules |
|-------|--------|
| `assistantId` | Required UUID |
| `messages` | 1–50 items; each `role` ∈ `user` \| `assistant`; `content` 1–2000 chars; **last message must be `role: user`** |
| Forbidden | `system`, `model`, `systemPrompt`, `stream`, `organizationId`, unknown fields |

Organization is derived **only** from the verified publishable key. Prior user/assistant turns are kept for multi-turn UX but treated as **untrusted client-supplied text** in the system prompt.

### Success — SSE (`text/event-stream`)

Headers: `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`

```text
event: meta
data: {"model":"gpt-…"}

event: delta
data: {"content":"We"}

event: delta
data: {"content":" are open…"}

event: done
data: {"finishReason":"stop","usage":{"promptTokens":n,"completionTokens":n,"totalTokens":n}}
```

Public (organization-actor) streams emit `meta` as `{ model }` only — no `organizationId`. Member/JWT AI streams still include `organizationId` for dashboard parity.

### Errors (HTTP, before first SSE event)

| Status | When |
|--------|------|
| 400 | Invalid body; key in query; empty/oversized messages; last message not `user` |
| 401 | Missing/invalid/revoked key (uniform message) |
| 404 | Assistant missing, wrong org for key, or status ≠ `live` |
| 429 | Chat rate limit (key, org, or IP) — response includes `Retry-After: 60` |
| 503 | `AI_NOT_CONFIGURED` |

### Errors (SSE, after headers)

```text
event: error
data: {"statusCode":502,"code":"AI_PROVIDER_ERROR","message":"Upstream model request failed"}
```

Client disconnect aborts upstream provider work (chat stream + RAG embed when in flight) before or during SSE.

## Request processing order

1. Verify publishable key (guard).
2. Resolve live same-org assistant (**404** without burning chat quota).
3. Assert chat rate limits (key + org + IP).
4. `markUsed` on the key (fire-and-forget).
5. Prepare prompt (skip OpenAI embed when assistant has no ready knowledge sources).
6. Stream SSE.

## Rate limit (chat — separate from bootstrap)

| Bucket | Limit | Window |
|--------|-------|--------|
| Per publishable `keyId` | 20 | 60s |
| Per `organizationId` | 40 | 60s |
| Per client IP | 30 | 60s |

Bootstrap remains **60 / 60s per key** on a separate bucket. Multi-instance sharing deferred to Phase 10 Redis.

API sets Express `trust proxy` to **1 hop** so `req.ip` reflects the client behind Railway (not the proxy peer). Do not set `trust proxy` to `true`.

Response: **429** with `Retry-After: 60`.

## Tenant isolation

1. Key → `organizationId` (server-side only).
2. Assistant load scoped to that org + `status === live`.
3. Cross-tenant / draft / paused → **404** (oracle-safe, same as bootstrap).

## Metering

Usage events attribute spend to the **organization** from the key. `user_id` is null (no JWT visitor). Operations: `embed` (RAG, only when ready knowledge exists) + `chat_stream`.

## Persistence

None. Conversation history is client-held in the request body.

## CORS

Public `/api/v1/public/**` CORS: reflect origin, `credentials: false`, methods **`GET`, `POST`, `OPTIONS`**, allowed headers include `Content-Type`, `Authorization`, `X-Genie-Public-Key`.

## Performance (Gate 4)

| Target | Value |
|--------|-------|
| p95 TTFB (first `meta`) | &lt; 1.5s (RAG warm path; provider-bound thereafter) |
| Pre-stream DB | key verify + assistant(+knowledge) read |
| Streaming | SSE; abort on disconnect; no embed when no ready knowledge |

## Security

- AI only via `AiService` (organization actor — no membership check; caller already key-authenticated).
- No client `system` / `model` / org id.
- History turns treated as untrusted in the system prompt.
- Never log plaintext `pk_live`.
- Open CORS + public key: mitigate with chat rate limits (key/org/IP) + key revoke.
