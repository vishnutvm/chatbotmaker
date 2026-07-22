# Infrastructure Architecture

**Last Updated:** 2026-07-22  
**Canonical MVP Stack**

---

## Approved MVP Stack

| Layer | Platform | Notes |
|-------|----------|-------|
| Frontends | Vercel Free (`apps/web`) |
| API | Railway + Docker | `apps/api` via `docker/Dockerfile` |
| Database | Supabase PostgreSQL | Prisma ORM, connection pooling |
| Authentication | Supabase Auth | Identity provider |
| Authorization | NestJS | RBAC, tenant isolation |
| File Storage | Supabase Storage | Tenant-scoped paths |
| Vector Search | pgvector | On Supabase PostgreSQL |
| AI | OpenAI | Via AIProvider abstraction |
| Payments | Stripe | Phase 8 |
| DNS/CDN | Cloudflare | DNS, CDN, WAF |

**Cost target:** < $30/month infrastructure during MVP (excluding OpenAI usage).

---

## Removed from MVP Requirements

| Service | Status |
|---------|--------|
| MongoDB Atlas | Replaced by Supabase PostgreSQL |
| Redis Cloud | Not required for MVP; memory cache sufficient |
| AWS S3 | Replaced by Supabase Storage |

These remain documented as **future scale options** only.

---

## Deployment Topology

```text
Cloudflare
    |
    +----------------------+----------------------+
    |                      |                      |
    v                      v                      v
Marketing (Vercel)    Dashboard (Vercel)    Widget CDN (R2)
    |                      |               cdn.<domain>/widget.js
    +----------+-----------+
               |
               v
          NestJS API
           Railway
               |
       +-------+-------+
       |       |       |
       v       v       v
   Supabase  OpenAI  Stripe
       |
   +---+---+---+---+
   |   |   |   |   |
   v   v   v   v   v
  PG Auth Store vector
```

---

## Service Responsibilities

### Vercel (Frontends)

- Static and server-rendered pages
- Environment: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Auto-deploy from GitHub main branch

### Railway (API)

- Docker container from `docker/Dockerfile`
- Environment: `DATABASE_URL`, `SUPABASE_*`, `OPENAI_API_KEY`, `STRIPE_*`
- Health check: `GET /health`
- Config: `railway.toml`

### Supabase

- **PostgreSQL:** Application data, pgvector embeddings
- **Auth:** User identity, sessions, email flows
- **Storage:** Knowledge documents, avatars, exports
- **Connection pooling:** Use pooler URL for API (`DATABASE_URL`)
- **Direct connection:** Use `DIRECT_URL` for Prisma migrations

### Cloudflare

- DNS for custom domains
- CDN for static assets and **widget.js** (R2 origin + custom domain `cdn.<domain>`)
- Deploy: `scripts/deploy-widget-cdn.sh` — see `docs/deployment/WIDGET_CDN.md` and ADR 0005
- WAF rules (production)

### OpenAI

- Chat completions, embeddings
- Accessed only through `AIProvider` in NestJS

### Stripe

- Subscriptions, checkout, webhooks (Phase 8)

---

## Environment Separation

| Environment | Database | Auth | API Host |
|-------------|----------|------|----------|
| Local dev | Supabase local or dev project | Supabase dev | localhost:4000 |
| CI | PostgreSQL container | Test JWT secret | Docker |
| Staging | Supabase staging project | Supabase staging | Railway staging |
| Production | Supabase production | Supabase production | Railway production |

---

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`):

1. `pnpm install`
2. Lint
3. Typecheck
4. Test
5. Build
6. Docker API build + health verify (with PostgreSQL service)

---

## Abstraction Requirements

Business logic must not directly import:

- `@supabase/supabase-js` in controllers (use services/providers)
- `openai` in controllers (use AIProvider)
- Supabase Storage SDK in business services (use StorageProvider)

Infrastructure providers live in `apps/api/src/infrastructure/`.

---

## Future Infrastructure (Not MVP)

| Service | Trigger |
|---------|---------|
| AWS ECS | API scale beyond Railway comfort |
| Redis | Distributed cache, rate limiting, job queues |
| AWS S3 | Storage cost/egress optimization |
| Dedicated vector DB | > 1M embeddings or latency requirements |

Migration path: `Railway → AWS ECS` · `Memory cache → Redis` · `Supabase Storage → S3` (via abstraction).
