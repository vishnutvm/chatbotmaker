# Supabase Infrastructure Migration Plan

**Status:** In Progress  
**Last Updated:** 2026-07-07  
**Phase:** 2 — Authentication & Foundation  
**Decision:** Approved — adopt Supabase data platform for MVP

---

## 1. Executive Summary

Genie (ChatbotMaker) is migrating from a MongoDB + Redis + AWS S3 MVP stack to a Supabase-centric architecture. Supabase provides PostgreSQL, Auth, Storage, and pgvector in a single platform, reducing operational complexity and aligning with the relational SaaS data model (organizations, memberships, RBAC, billing, knowledge bases, conversations).

NestJS remains the business logic layer. Next.js frontends remain on Vercel. The API remains on Railway. This migration replaces data persistence, authentication, file storage, and vector search foundations — not the application framework.

---

## 2. Current Architecture

```text
Internet → Cloudflare → Next.js (Vercel) → NestJS (Railway)
                                              ├── MongoDB Atlas (Mongoose)
                                              ├── Memory cache (Redis planned)
                                              └── Custom JWT auth (bcrypt)
```

**Implemented today:**
- NestJS API with Mongoose models (`users`, `organizations`, `organization_members`)
- Custom JWT access/refresh tokens with bcrypt password hashing
- Memory cache abstraction (no Redis provider implemented)
- Dashboard login/signup calling NestJS auth endpoints
- No S3, RAG, or AI modules in code

---

## 3. Target Architecture

```text
Internet → Cloudflare → Next.js (Vercel) → NestJS (Railway)
                                              ├── Supabase PostgreSQL (Prisma)
                                              ├── Supabase Auth (identity)
                                              ├── Supabase Storage (files)
                                              └── pgvector (embeddings)
```

---

## 4. Architecture Changes

| Component | Before | After |
|-----------|--------|-------|
| Primary database | MongoDB Atlas + Mongoose | Supabase PostgreSQL + Prisma |
| Authentication | Custom JWT + bcrypt | Supabase Auth |
| Authorization | NestJS JWT claims | NestJS RBAC (unchanged responsibility) |
| File storage | AWS S3 (planned) | Supabase Storage |
| Vector search | MongoDB Vector Search (planned) | PostgreSQL pgvector |
| Cache | Memory → Redis (planned) | Memory only for MVP |
| ORM | Mongoose | Prisma |

---

## 5. Documentation Changes

| Document | Action |
|----------|--------|
| `docs/adr/0001-adopt-supabase-data-platform.md` | Create |
| `docs/architecture/*.md` | Create/update |
| `docs/database/*.md` | Create |
| `docs/deployment/DEPLOYMENT_ARCHITECTURE.md` | Create |
| `docs/security/SECURITY_ARCHITECTURE.md` | Create |
| `docs/development/PROJECT_STATUS.md` | Create/update |
| `.cursor/rules/infrastructure-blueprint.mdc` | Update |
| `.cursor/rules/database-engineering.mdc` | Update |
| `README.md` | Update env/setup references |
| External `chatbotmaker-docs` | Human sync required |

---

## 6. Database Changes

- Replace Mongoose schemas with Prisma relational models
- Phase 1 tables: `users`, `organizations`, `organization_members`
- Logical design documented for future phases (assistants, knowledge, RAG, billing)
- UUID primary keys, foreign keys, unique constraints, timestamps
- Enable `pgvector` extension via migration SQL

---

## 7. Authentication Changes

**Supabase Auth handles:**
- Registration, login, email verification, password reset
- Access/refresh token lifecycle
- OAuth (future)

**NestJS handles:**
- Supabase JWT validation (JWKS / JWT secret)
- Application user provisioning (`onboard` endpoint)
- Organization/workspace authorization
- RBAC permission checks
- API key authentication (future)

**Removed from NestJS:**
- bcrypt password hashing
- Custom JWT issuance
- Login/signup/refresh endpoints that duplicate Supabase

---

## 8. Authorization Changes

- `SupabaseAuthGuard` validates Bearer token from Supabase
- `CurrentUser` enriched with application `userId`, `organizationId`, `role`
- Never trust client-supplied `organization_id` without membership check
- Future: PostgreSQL RLS as defense-in-depth layer

---

## 9. Storage Changes

- `StorageProvider` interface (upload, download, delete, getSignedUrl, exists, validateFile)
- `SupabaseStorageProvider` implementation
- Tenant-aware paths: `organizations/{orgId}/knowledge/...`
- AWS S3 deferred to future scale via `S3StorageProvider`

---

## 10. RAG Changes

- Pipeline documented in `docs/architecture/RAG_ARCHITECTURE.md`
- `document_chunks` table with pgvector `embedding` column
- Tenant + knowledge base filtering on every vector query
- Implementation deferred to Phase 5 (Knowledge)

---

## 11. Vector Database Changes

- pgvector extension on Supabase PostgreSQL
- `vector(1536)` for OpenAI `text-embedding-3-small` (configurable)
- IVFFlat or HNSW index when data volume warrants
- MVP: sequential scan with tenant filters acceptable at low volume

---

## 12. Backend Changes

| Module | Change |
|--------|--------|
| `database.module` | Prisma instead of Mongoose |
| `auth` | Supabase JWT validation, onboard endpoint |
| `users` | Prisma repository |
| `organizations` | Prisma repository |
| `storage` | New abstraction module |
| `cache` | Keep memory provider; Redis documented as future |

---

## 13. Frontend Changes

- Dashboard uses `@supabase/supabase-js` for login/signup/session
- `auth-session.ts` stores Supabase session tokens
- API calls use Supabase `access_token` as Bearer
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` added

---

## 14. Environment Variable Changes

See root `.env.example` and `apps/api/.env.example`. Key additions:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET` (for JWT validation)
- `DATABASE_URL`, `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Removed from MVP requirements: `MONGODB_URI`, `REDIS_URL`, AWS S3 vars.

---

## 15. Deployment Changes

- Railway API: `DATABASE_URL` pointing to Supabase pooler
- CI: PostgreSQL service container replaces MongoDB
- Docker health check: requires `DATABASE_URL`
- Vercel dashboard: Supabase public env vars

---

## 16. Testing Changes

- Unit tests: mock Prisma / repositories
- Integration tests: PostgreSQL test database or container
- Auth tests: Supabase JWT validation with test secret
- Tenant isolation tests: required before Phase 3 complete
- E2E: health endpoint (existing), auth flow (updated)

---

## 17. Security Considerations

- Service role key server-only; never in frontend
- Validate Supabase JWT on every protected route
- Tenant isolation at repository query level
- RLS policies planned for direct Supabase access paths
- File upload validation (size, MIME) in StorageProvider
- Rate limiting on auth endpoints (future)

---

## 18. Migration Risks

| Risk | Mitigation |
|------|------------|
| No production MongoDB data to migrate | Greenfield PostgreSQL schema |
| Supabase vendor lock-in | Abstractions for storage, auth validation |
| JWT algorithm differences | JWKS + secret fallback |
| CI without Supabase project | PostgreSQL container + test JWT secret |
| Dual auth during transition | Single cutover; no parallel systems |
| pgvector performance at scale | Index strategy documented; optimize later |

---

## 19. Rollback Strategy

1. Revert code to previous commit (MongoDB branch)
2. Restore `MONGODB_URI` in Railway
3. Re-deploy previous Docker image
4. No data rollback needed (no production users on MongoDB yet)

---

## 20. Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Repository analysis | ✅ Complete |
| 2 | Migration plan (this document) | ✅ Complete |
| 3 | ADR | In progress |
| 4 | Architecture documentation | In progress |
| 5 | Infrastructure documentation | In progress |
| 6 | PostgreSQL database design | In progress |
| 7 | Supabase configuration docs | In progress |
| 8 | Database foundation (Prisma) | Pending |
| 9 | Supabase Auth integration | Pending |
| 10 | Multi-tenancy foundation | Pending |
| 11 | Storage abstraction | Pending |
| 12 | pgvector foundation | Pending |
| 13 | RAG architecture docs | Pending |
| 14 | Remove MongoDB dependencies | Pending |
| 15 | Remove unnecessary Redis refs | Pending |
| 16 | Remove S3 MVP requirements | Pending |
| 17 | Environment configuration | Pending |
| 18 | Deployment configuration | Pending |
| 19 | Update tests | Pending |
| 20 | Complete validation | Pending |

---

## 21. Acceptance Criteria

- [ ] All architecture docs consistent with Supabase stack
- [ ] Prisma schema matches Phase 2 entities
- [ ] Auth flow uses Supabase (no duplicate password system in NestJS)
- [ ] Protected APIs validate Supabase JWT
- [ ] Tenant-scoped queries in repositories
- [ ] StorageProvider abstraction exists
- [ ] pgvector extension migration SQL exists
- [ ] CI passes (lint, typecheck, test, build, docker)
- [ ] No Mongoose/MongoDB runtime dependencies
- [ ] Environment examples documented

---

## 22. Definition of Done

Per project `definition-of-done.mdc`:

- Requirements met for Phase 2 auth + data foundation
- Architecture and security documented
- Unit tests pass
- Build passes
- Lint and typecheck pass
- `PROJECT_STATUS.md` updated
- No critical migration defects
