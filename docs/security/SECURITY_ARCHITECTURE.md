# Security Architecture

**Last Updated:** 2026-07-07

---

## Authentication

- **Identity:** Supabase Auth (registration, login, tokens)
- **API validation:** NestJS validates Supabase JWT on every protected route
- **Token storage:** Supabase client session (dashboard); httpOnly cookies (future enhancement)
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` server-only

---

## Authorization

- **RBAC:** Organization roles (owner, admin, member) enforced in NestJS services
- **Tenant isolation:** All data access scoped by `organization_id`
- **API keys:** Hashed, scoped to organization (future)
- **Permission checks:** In services/guards, not only UI

---

## Input Validation

- DTO validation at API boundaries (`class-validator`)
- Reject unknown fields (`whitelist: true`, `forbidNonWhitelisted: true`)
- File upload: MIME type, size, extension validation in StorageProvider
- Sanitize user-controlled output in responses

---

## Injection Prevention

- **SQL:** Prisma parameterized queries only
- **NoSQL:** N/A (PostgreSQL)
- **XSS:** React escaping; CSP headers (production)
- **Path traversal:** Server-constructed storage paths with UUID filenames

---

## Secrets Management

| Secret | Location |
|--------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Railway env only |
| `SUPABASE_JWT_SECRET` | Railway env only |
| `DATABASE_URL` | Railway env only |
| `OPENAI_API_KEY` | Railway env only |
| `STRIPE_SECRET_KEY` | Railway env only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (public, rate-limited by Supabase) |

Never commit secrets. Never log tokens, passwords, or API keys.

---

## Multi-Tenancy Security

See `docs/database/MULTI_TENANCY.md`.

- Cross-tenant reads/writes prevented at repository level
- IDOR protection via membership verification
- Vector search tenant-filtered
- Storage paths include organization ID

---

## Rate Limiting (Future)

- Auth endpoints: strict limits
- Public API: per API key limits
- AI endpoints: per organization usage caps

---

## Audit Logging (Future)

Log: auth events, admin actions, billing changes, data exports.

Fields: `user_id`, `organization_id`, `action`, `resource`, `timestamp`, `ip`.

---

## Compliance Path

- Data export capability (future)
- Account deletion with cascade (future)
- GDPR: soft delete + hard delete policies documented per entity
