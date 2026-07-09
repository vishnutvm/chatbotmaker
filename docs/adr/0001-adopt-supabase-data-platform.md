# ADR 0001: Adopt Supabase Data Platform

**Status:** Accepted  
**Date:** 2026-07-07  
**Deciders:** Product Owner, AI Engineering Organization

---

## Context

The original Genie MVP infrastructure plan specified:

- **MongoDB Atlas** as the primary database
- **Redis Cloud** for caching and session coordination
- **AWS S3** for file storage
- **Custom JWT authentication** in NestJS with bcrypt
- **MongoDB Vector Search** for RAG embeddings (planned)

The application is a multi-tenant SaaS platform with strongly relational data: users, organizations, memberships, roles, workspaces, assistants, knowledge bases, documents, conversations, billing, and audit logs. These entities have natural foreign key relationships, constraints, and query patterns suited to a relational database.

---

## Problem

1. **Infrastructure complexity** — MongoDB + Redis + S3 + custom auth requires three separate services to operate before building product features.
2. **Data model mismatch** — Organization membership, RBAC, and billing are inherently relational; document modeling adds application-level join logic.
3. **Operational cost** — Multiple paid services increase MVP monthly cost and monitoring surface.
4. **Auth duplication risk** — Custom JWT + bcrypt in NestJS duplicates what a dedicated auth service provides.
5. **Vector search** — pgvector on PostgreSQL provides vector similarity without a separate vector database for MVP scale.

---

## Decision

**Adopt for MVP:**

| Capability | Platform |
|------------|----------|
| Primary database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| Vector storage | PostgreSQL pgvector |

**Keep:**

| Component | Platform |
|-----------|----------|
| Backend framework | NestJS |
| Frontend framework | Next.js |
| API hosting | Railway |
| Frontend hosting | Vercel |
| CDN/DNS | Cloudflare |
| AI provider | OpenAI (via abstraction layer) |
| Payments | Stripe |

**Remove from MVP requirements:**

- MongoDB Atlas
- Redis Cloud (mandatory)
- AWS S3 (mandatory)

---

## Rationale

1. **Relational SaaS model** — Users belong to organizations via memberships with roles. Foreign keys and unique constraints enforce integrity at the database level.
2. **pgvector** — Embeddings stored alongside document metadata enable tenant-filtered vector search in a single query.
3. **Reduced complexity** — One Supabase project provides database, auth, storage, and extensions.
4. **Cost** — Supabase free tier covers MVP development; fewer services to provision.
5. **Auth separation** — Supabase handles identity; NestJS handles application authorization (RBAC, tenant isolation).
6. **Abstraction boundaries** — StorageProvider and AIProvider interfaces allow future migration to S3 or other providers without rewriting business logic.

---

## Consequences

### Positive

- Single data platform for MVP
- Relational schema with migrations via Prisma
- Built-in auth with email verification and OAuth path
- pgvector without additional infrastructure
- Lower operational burden for small team

### Negative

- **Vendor dependency** on Supabase for database, auth, and storage
- **PostgreSQL schema design** required upfront; migrations must be managed
- **RLS policies** needed for defense-in-depth if clients access Supabase directly
- **Storage abstraction** required to avoid tight coupling to Supabase SDK
- **JWT validation** must integrate Supabase token format in NestJS

### Neutral

- NestJS remains the authoritative business logic layer
- Railway deployment unchanged
- Redis and AWS remain documented as future scale options

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Supabase outage affects all data services | Low | High | Backups, status monitoring, future read replicas |
| pgvector performance at large scale | Medium | Medium | Index strategy, pagination, future dedicated vector DB |
| Auth token validation complexity | Medium | Medium | JWKS + secret fallback, comprehensive tests |
| Migration effort from MongoDB code | Low | Low | Early-stage codebase; minimal production data |
| Supabase Storage limits | Low | Medium | StorageProvider abstraction; S3 migration path |

---

## Migration Strategy

1. Document target architecture (this ADR + migration plan)
2. Introduce Prisma with PostgreSQL schema for Phase 2 entities
3. Replace Mongoose repositories with Prisma repositories
4. Integrate Supabase Auth on frontend; validate JWT in NestJS
5. Add `POST /auth/onboard` for application user + organization provisioning
6. Remove custom JWT issuance and bcrypt from NestJS
7. Add StorageProvider and pgvector foundation
8. Update CI to use PostgreSQL
9. Update all documentation and cursor rules
10. Validate builds and tests

**Rollback:** Revert to previous git commit and restore MongoDB env vars. No production data migration required at current stage.
