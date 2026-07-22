# Table: `publishable_api_keys`

Org-scoped publishable widget keys (`pk_live_…`).

## Columns

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK → organizations | CASCADE delete |
| `name` | text | Display label |
| `key_prefix` | text | Safe display (prefix + ellipsis + last4) |
| `key_hash` | text UNIQUE | HMAC-SHA256 hex |
| `created_by_id` | uuid FK → users | RESTRICT |
| `last_used_at` | timestamptz nullable | Updated on successful bootstrap (best-effort) |
| `revoked_at` | timestamptz nullable | Soft revoke |
| `created_at` / `updated_at` | timestamptz | |

## Indexes

- `UNIQUE(key_hash)` — auth hot path
- `(organization_id, revoked_at)` — list / filter active

## Lookup strategy

Auth never searches by plaintext. Client sends full key → server computes hash → unique lookup. `key_prefix` is display-only (not used for auth).

## Assistant check

After key resolve: `assistants` where `id = :assistantId AND organization_id = :keyOrg AND status = 'live'`.

Optional index: `(organization_id, status)` if list-by-status grows; MVP may rely on PK id lookup + org equality check.
