# Publishable API keys (org-scoped `pk_live`)

**Auth:** Supabase JWT (`Authorization: Bearer <access_token>`)  
**RBAC:** Owner or admin only for create / list / revoke  
**Base:** `/api/v1`

Publishable keys authenticate the **embeddable widget** on public routes. They are **not** session tokens and must never grant dashboard/admin capabilities.

## Key format

- Prefix: `pk_live_`
- Suffix: URL-safe base64 of 32 random bytes
- Example: `pk_live_AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcd`

Plaintext is returned **once** on create. The API stores **HMAC-SHA256(pepper, rawKey)** only.

## Create

```http
POST /api/v1/organizations/:organizationId/public-keys
Authorization: Bearer <jwt>
Content-Type: application/json

{ "name": "Production site" }
```

`name` optional (default `"Default"`), max 100 chars.

**201**

```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "name": "Production site",
  "keyPrefix": "pk_live_AbCd…6789",
  "key": "pk_live_…full…",
  "createdById": "uuid",
  "createdAt": "ISO-8601",
  "lastUsedAt": null,
  "revokedAt": null
}
```

| Status | When |
|--------|------|
| 401 | Missing/invalid JWT |
| 403 | Not owner/admin |
| 404 | Organization not found / not a member |
| 400 | Invalid body |

## List

```http
GET /api/v1/organizations/:organizationId/public-keys
Authorization: Bearer <jwt>
```

**200**

```json
{
  "keys": [
    {
      "id": "uuid",
      "organizationId": "uuid",
      "name": "Production site",
      "keyPrefix": "pk_live_AbCd…6789",
      "createdById": "uuid",
      "createdAt": "ISO-8601",
      "lastUsedAt": null,
      "revokedAt": null
    }
  ]
}
```

Never includes `key` or `keyHash`.

## Revoke

```http
POST /api/v1/organizations/:organizationId/public-keys/:keyId/revoke
Authorization: Bearer <jwt>
```

**200** — same shape as list item with `revokedAt` set. Idempotent if already revoked.

| Status | When |
|--------|------|
| 404 | Key not in org |

## Performance / cost (Gate 4–5)

- Create: 1 write; List: 1 indexed read by `(organization_id)`; Revoke: 1 update by `(id, organization_id)`
- No OpenAI / Redis in this path
