# Public widget bootstrap

**Auth:** Publishable key (`pk_live_…`) — **no JWT**  
**Base:** `/api/v1/public`

Used by `GenieWidget` after local config validation. Returns **public-safe display config** only (no instructions, knowledge, or member data).

Live chat streaming: [`widget-public-chat-stream.md`](./widget-public-chat-stream.md) (`POST /api/v1/public/widget/chat/stream`).

## Bootstrap

```http
GET /api/v1/public/widget/bootstrap?assistantId=<uuid>
X-Genie-Public-Key: pk_live_…
```

Alternate header (also accepted):

```http
Authorization: Bearer pk_live_…
```

**Never** put the key in the query string (rejected with **400**).

### Success — 200

```json
{
  "assistantId": "uuid",
  "organizationId": "uuid",
  "name": "Support bot",
  "welcomeMessage": "Hi! How can we help?",
  "appearance": {}
}
```

`appearance` is the assistant’s public JSON blob (colors/position hints). Do not include `instructions` or knowledge fields.

### Errors

| Status | When |
|--------|------|
| 400 | Missing/invalid `assistantId`; key present in query |
| 401 | Missing header, bad `pk_live_` shape, unknown or revoked key |
| 404 | Assistant missing, wrong org for key, or status ≠ `live` |
| 429 | Per-key bootstrap rate limit exceeded |

Uniform messaging for unknown vs revoked keys (no oracle). Cross-tenant / non-live assistants use **404** (same as missing).

## Rate limits (MVP)

Bootstrap and chat use **separate** in-memory buckets (do not share counters):

| Surface | Bucket | Limit | Window |
|---------|--------|-------|--------|
| Bootstrap | Per publishable `keyId` | 60 | 60s |
| Chat stream | Per publishable `keyId` | 20 | 60s |
| Chat stream | Per `organizationId` | 40 | 60s |

Multi-instance sharing deferred to Phase 10 Redis. Response: **429** with optional `Retry-After: 60`.

## CORS

`/api/v1/public/**` uses open CORS (`origin` reflected or `*`, `credentials: false`) so third-party embeds can call bootstrap and chat. All other API routes keep `CORS_ORIGINS`.

## Performance (Gate 4)

| Target | Value |
|--------|-------|
| p95 latency | &lt; 200ms (excl. cold start) |
| DB reads | ≤ 2 (key by `key_hash`, assistant by id+org+live) |
| Indexes | `UNIQUE(key_hash)`; `(organization_id, revoked_at)`; assistants `(organization_id, status)` optional |

## Widget UI states (Gate 6)

| State | Behavior |
|-------|----------|
| Loading | Panel/composer disabled; “Connecting…” (or equivalent) while bootstrap runs |
| Success | Apply `name` / `welcomeMessage` / appearance; ready for chat stream |
| Error (401/404) | Clear in-panel error; do not pretend ready |
| Error (429) | Retry hint; keep error visible |
| Offline / network | Same error path with network message |
