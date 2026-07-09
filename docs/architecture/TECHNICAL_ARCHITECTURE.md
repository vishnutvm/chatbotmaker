# Technical Architecture

**Last Updated:** 2026-07-07  
**Stack Version:** Supabase MVP

---

## Overview

Genie is a developer-first AI Agent SaaS platform built as a Turborepo monorepo. The architecture follows a modular monolith pattern on the backend with clear module boundaries and provider abstractions.

---

## System Diagram

```text
                         Internet
                            |
                            v
                       Cloudflare
                     (DNS / CDN / WAF)
                            |
            +---------------+---------------+
            |                               |
            v                               v
    apps/marketing                   apps/dashboard
    Next.js (SSR/SSG)                Next.js (CSR)
    Vercel                           Vercel
            |                               |
            +---------------+---------------+
                            |
                            v
                      apps/api (NestJS)
                         Railway
                            |
         +------------------+------------------+
         |                  |                  |
         v                  v                  v
     Supabase            OpenAI             Stripe
         |
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    v
  PG   Auth Store pgvector
```

---

## Application Layers

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Presentation | Next.js | UI, routing, client state |
| API Gateway | NestJS controllers | Input validation, HTTP mapping |
| Business Logic | NestJS services | Orchestration, authorization, domain rules |
| Data Access | Prisma repositories | PostgreSQL queries only |
| Identity | Supabase Auth | Registration, login, tokens |
| Authorization | NestJS guards/services | RBAC, tenant isolation |
| Storage | StorageProvider | File upload/download abstraction |
| AI | AIProvider | Model calls, embeddings, streaming |
| Shared Types | `packages/types` | Cross-app TypeScript contracts |
| API Client | `packages/api-client` | Typed HTTP client for frontends |

---

## Monorepo Structure

```text
genie-platform/
├── apps/
│   ├── marketing/     # Public marketing site
│   ├── dashboard/     # Authenticated admin UI
│   ├── api/           # NestJS backend
│   └── widget/        # Embeddable chat widget
├── packages/
│   ├── types/         # Shared TypeScript types
│   ├── ui/            # Shared React components
│   ├── api-client/    # HTTP client
│   └── config/        # Shared TS/ESLint config
├── docs/              # Engineering documentation
└── docker/            # API container
```

---

## Module Boundaries (NestJS)

Each domain module is independently maintainable:

```text
auth · users · organizations · workspaces · authorization
assistants · knowledge · documents · storage · rag · ai
conversations · actions · integrations · webhooks · workflows
analytics · usage · billing · notifications · audit
```

Modules are introduced per roadmap phase. Phase 2 implements: `auth`, `users`, `organizations`.

---

## Data Flow — Authentication

```text
1. User signs up via Dashboard → Supabase Auth
2. Dashboard receives Supabase session (access_token)
3. Dashboard calls POST /api/v1/auth/onboard with Bearer token
4. NestJS validates Supabase JWT
5. NestJS creates application user + organization + membership
6. Subsequent API calls use Supabase access_token
7. NestJS guard validates JWT → loads app user → checks RBAC
```

---

## Multi-Tenancy

- Every tenant-owned record includes `organization_id`
- Workspace-scoped records include `workspace_id` where applicable
- Repositories always filter by authorized organization
- Never trust client-supplied tenant IDs without membership verification

---

## Provider Abstractions

```typescript
// Storage — swap SupabaseStorageProvider ↔ S3StorageProvider
interface StorageProvider {
  upload(path: string, file: Buffer, options: UploadOptions): Promise<StorageObject>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresIn: number): Promise<string>;
  exists(path: string): Promise<boolean>;
  validateFile(file: Buffer, mimeType: string): void;
}

// AI — never import openai in controllers
interface AIProvider {
  chat(params: ChatParams): Promise<ChatResponse>;
  embed(text: string): Promise<number[]>;
  stream(params: ChatParams): AsyncIterable<string>;
}

// Cache — memory for MVP; Redis future
interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}
```

---

## API Conventions

- Base path: `/api/v1`
- Health check: `/health` (no prefix)
- RESTful resource naming
- DTO validation via `class-validator`
- Consistent error shapes
- Pagination on list endpoints (cursor or offset)

---

## Security Architecture

See `docs/security/SECURITY_ARCHITECTURE.md` and `docs/architecture/AUTHENTICATION_ARCHITECTURE.md`.

---

## Future Scaling

| Trigger | Action |
|---------|--------|
| High API load | Scale Railway containers; consider AWS ECS |
| Distributed caching needed | Introduce Redis via CacheProvider |
| Storage egress cost | Evaluate S3 + CloudFront via StorageProvider |
| Vector scale > 1M chunks | Evaluate dedicated vector DB or HNSW tuning |
| Background job volume | Introduce job queue (BullMQ + Redis) |
