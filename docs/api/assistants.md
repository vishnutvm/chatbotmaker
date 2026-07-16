# Assistants API (Phase 6 MVP + Knowledge text/url)

Authenticated organization-scoped assistants for the create wizard. Knowledge sources for MVP: **text** and **url** (fetched HTML→text). Full crawl/PDF/embeddings deferred.

**Base path:** `/api/v1`  
**Module:** `apps/api/src/modules/assistants/`

## Auth & tenancy

| Requirement | Detail |
|-------------|--------|
| Scheme | `Authorization: Bearer <Supabase access_token>` |
| Guard | `SupabaseJwtGuard` |
| Tenant | Path `organizationId`; `OrganizationsService.requireMembership` |
| Roles | Any member: read + create + update + chat; managers for delete |

## Endpoints

### GET `/organizations/:organizationId/assistants`

List assistants for org (newest updated first).

**200** `{ "assistants": AssistantDto[] }`

### POST `/organizations/:organizationId/assistants`

Create draft assistant. Applies purpose preset defaults for welcome/tone/instructions when omitted.

```json
{
  "name": "Acme Support",
  "purpose": "customer_support",
  "description": "optional"
}
```

**201** `AssistantDto`

### GET `/organizations/:organizationId/assistants/:assistantId`

**200** `AssistantDto` (includes `knowledgeSources`)

### PATCH `/organizations/:organizationId/assistants/:assistantId`

Partial update: name, description, purpose, welcomeMessage, tone, instructions, status, appearance.

**200** `AssistantDto`

### DELETE `/organizations/:organizationId/assistants/:assistantId`

Managers only. **204**

### POST `/organizations/:organizationId/assistants/:assistantId/knowledge`

```json
{
  "type": "text",
  "name": "Refund policy",
  "content": "..."
}
```

or

```json
{
  "type": "url",
  "name": "Pricing page",
  "url": "https://example.com/pricing"
}
```

URL: server fetches page, strips tags, stores text (max ~100k chars). Status `ready` or `failed`.

**201** `KnowledgeSourceDto`

### GET `/organizations/:organizationId/assistants/:assistantId/knowledge`

**200** `{ "sources": KnowledgeSourceDto[] }`

### DELETE `/organizations/:organizationId/assistants/:assistantId/knowledge/:sourceId`

**204**

### POST `/organizations/:organizationId/assistants/:assistantId/deploy`

Sets `status: live`, `deployedAt: now`. Requires **owner** or **admin**.

**200** `AssistantDto`

### POST `/organizations/:organizationId/assistants/:assistantId/chat`

Playground / Test step. Builds system prompt from assistant instructions + welcome context + knowledge contents; calls AI provider. Client messages may only use `user` / `assistant` roles (system prompt is server-owned).

```json
{
  "messages": [{ "role": "user", "content": "What are your hours?" }]
}
```

**200** same shape as AI chat completion response (+ `assistantId`)

## DTOs

```ts
AssistantDto {
  id, organizationId, name, description, purpose, status,
  welcomeMessage, tone, instructions,
  knowledgeSourceCount, conversationCount: 0,
  appearance: { primaryColor, position, showWelcomeBubble, avatarUrl? },
  deployed: boolean, deployedAt?, createdAt, updatedAt,
  knowledgeSources?: KnowledgeSourceDto[]
}

KnowledgeSourceDto {
  id, assistantId, name, type: 'text'|'url'|'website'|'file'|'sitemap',
  status, url?, contentPreview?, pageCount, documentCount, lastUpdatedAt
}
```

`purpose`: `customer_support` | `sales` | `product_expert` | `documentation` | `lead_generation` | `custom`  
`tone`: `friendly` | `professional` | `helpful` | `concise` | `custom`  
`status`: `draft` | `live` | `paused`

## Performance

- List: 1 query, indexed `(organization_id, updated_at)`
- Chat: 2 DB reads + 1 LLM call; knowledge truncated to ~12k chars total in prompt

## Security

- Always filter by `organizationId` from path + membership
- Never trust client `organizationId` in body
- Sanitize/limit knowledge content size
- No secrets in responses
