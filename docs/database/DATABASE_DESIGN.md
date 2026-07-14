# Database Design

**Last Updated:** 2026-07-14  
**Database:** Supabase PostgreSQL  
**ORM:** Prisma

---

## Design Principles

1. Relational schema with foreign keys and constraints
2. UUID primary keys (`gen_random_uuid()`)
3. `organization_id` on all tenant-owned entities
4. `workspace_id` where workspace scoping applies
5. JSONB only for genuinely flexible metadata
6. Timestamps (`created_at`, `updated_at`) on all tables
7. Soft delete via `deleted_at` where audit trail required

---

## Phase 2 — Implemented Tables

### users

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| supabase_user_id | uuid | UNIQUE, NOT NULL |
| email | citext/text | UNIQUE, NOT NULL |
| name | varchar(100) | NOT NULL |
| email_verified | boolean | DEFAULT false |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

**Purpose:** Application user profile linked 1:1 to Supabase Auth user.

**Indexes:** `supabase_user_id` (unique), `email` (unique)

**Query patterns:** Lookup by `supabase_user_id` on every authenticated request; lookup by `email` for admin.

---

### organizations

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| name | varchar(100) | NOT NULL |
| slug | varchar(100) | UNIQUE, NOT NULL |
| owner_id | uuid | FK → users.id, NOT NULL |
| plan | varchar(50) | DEFAULT 'free' |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

**Purpose:** Top-level tenant entity for billing, data isolation, team management.

**Indexes:** `slug` (unique), `owner_id`

**Query patterns:** Lookup by id, slug; list by owner.

---

### organization_members

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users.id, ON DELETE CASCADE |
| organization_id | uuid | FK → organizations.id, ON DELETE CASCADE |
| role | varchar(20) | NOT NULL, CHECK IN ('owner','admin','member') |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

**Purpose:** Many-to-many user ↔ organization with role.

**Indexes:** UNIQUE `(user_id, organization_id)`, INDEX `user_id`, INDEX `organization_id`

**Query patterns:** List memberships for user; verify user role in organization.

---

### organization_invitations (Phase 3)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations.id, ON DELETE CASCADE |
| email | text | NOT NULL |
| role | enum | `admin` \| `member` (default `member`; never `owner` via invite) |
| token | text | UNIQUE, NOT NULL |
| invited_by_id | uuid | FK → users.id, ON DELETE CASCADE |
| status | enum | `pending` \| `accepted` \| `revoked` \| `expired` |
| expires_at | timestamptz | NOT NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

**Purpose:** Email invitations for users not yet onboarded (or not yet added). Accept path matches JWT email to `email`.

**Indexes:** UNIQUE `token`; INDEX `(organization_id, status)`; INDEX `email`

**Query patterns:** Lookup by token on accept; list pending by org; conflict check pending by org + email.

---

## Phase 4 — Implemented Tables

### ai_usage_events

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| organization_id | uuid | FK → organizations.id, ON DELETE CASCADE, NOT NULL |
| user_id | uuid | FK → users.id, ON DELETE SET NULL, nullable |
| provider | text | NOT NULL (e.g. `openai`) |
| model | text | NOT NULL |
| operation | text | NOT NULL (`chat` \| `chat_stream`) |
| prompt_tokens | int | nullable |
| completion_tokens | int | nullable |
| total_tokens | int | nullable |
| latency_ms | int | nullable |
| status | text | NOT NULL (`success` \| `error`) |
| error_code | text | nullable |
| created_at | timestamptz | NOT NULL, default now() |

**Purpose:** Append-only AI usage telemetry for cost/usage tracking per organization (Phase 4 AI Platform Core). No `updated_at` — events are immutable.

**Indexes:** INDEX `(organization_id, created_at)`; INDEX `(user_id, created_at)`

**Query patterns:** List/aggregate usage by org within a time range; optional per-user breakdown; billing/analytics rollups by `provider`/`model`/`operation`/`status`.

**Migration:** `20260714140000_ai_usage_events`

---

## Phase 4+ — Logical Design (Not Yet Implemented)

### workspaces

Organization sub-tenants for project isolation (deferred; org is the only tenant today).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| organization_id | uuid | FK, NOT NULL |
| name | varchar(100) | |
| slug | varchar(100) | UNIQUE per org |

### workspace_members

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK |
| workspace_id | uuid | FK |
| role | varchar(20) | |

### roles / permissions / role_permissions

RBAC system for fine-grained authorization.

### assistants / assistant_settings

AI assistant configuration per workspace.

### knowledge_bases / knowledge_sources

RAG knowledge container and source tracking (URL, file, sitemap).

### documents / document_chunks

Uploaded files and chunked content with pgvector embeddings.

### conversations / messages

Chat history with tenant isolation.

### api_keys

Hashed API keys for public REST API access.

### subscriptions / usage_records

Stripe billing and metered usage.

### audit_logs / notifications

Compliance and user notifications.

Full column definitions will be added as each phase is implemented.

---

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

---

## Migrations

Managed via Prisma Migrate:

```bash
cd apps/api
npx prisma migrate dev
npx prisma migrate deploy  # production
```

Migration SQL for pgvector in `apps/api/prisma/migrations/`.

---

## Connection URLs

| Variable | Use |
|----------|-----|
| `DATABASE_URL` | Pooled connection (API runtime) |
| `DIRECT_URL` | Direct connection (migrations) |

---

## Data Growth Estimates (MVP)

| Table | Year 1 Estimate |
|-------|-----------------|
| users | 10K |
| organizations | 5K |
| organization_members | 15K |
| ai_usage_events | 2M (Phase 4+) |
| document_chunks | 500K (Phase 5+) |
| messages | 1M (Phase 4+) |

---

## Security

- All tenant queries include `organization_id` filter
- Foreign keys enforce referential integrity
- RLS policies (future) for direct Supabase client access
- No PII in logs
