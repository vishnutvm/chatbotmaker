# Deployment Architecture

**Last Updated:** 2026-07-07

---

## MVP Deployment

```text
Cloudflare (DNS/CDN)
    |
    +----------------------+
    |                      |
    v                      v
Marketing (Vercel)    Dashboard (Vercel)
    |                      |
    +----------+-----------+
               |
               v
          NestJS API (Railway)
               |
       +-------+-------+
       |       |       |
       v       v       v
   Supabase  OpenAI  Stripe
```

---

## Services

### Vercel — Frontends

| App | Root | Port (dev) |
|-----|------|------------|
| marketing | `apps/marketing` | 3000 |
| dashboard | `apps/dashboard` | 3001 |

**Env vars (dashboard):**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Railway — API

| Setting | Value |
|---------|-------|
| Dockerfile | `docker/Dockerfile` |
| Health check | `/health` |
| Port | `4000` (or `PORT` env) |

**Env vars:**
- `DATABASE_URL` — Supabase pooler
- `DIRECT_URL` — Supabase direct (migrations)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- `CORS_ORIGINS`
- `OPENAI_API_KEY` (Phase 4+)
- `STRIPE_*` (Phase 8+)

### Supabase

Create project at [supabase.com](https://supabase.com). Enable:
- PostgreSQL
- Auth (email/password)
- Storage buckets: `knowledge`, `avatars`, `exports`
- pgvector extension

---

## CI/CD

`.github/workflows/ci.yml`:
1. Lint, typecheck, test, build
2. Docker build with PostgreSQL service container
3. Health check against container

Deploy triggers:
- Vercel: auto on push to main
- Railway: auto on push to main (GitHub integration)

---

## Local Development

```bash
pnpm install
# Configure apps/api/.env and apps/dashboard/.env.local
cd apps/api && npx prisma migrate dev
pnpm dev
```

---

## Rollback

1. Revert git commit
2. Re-deploy previous Railway image
3. Prisma migrations are forward-only; write down migration for rollback if needed

---

## Future: AWS ECS

Trigger: sustained high traffic, custom networking, or compliance requirements.

Migration: same Docker image, different orchestrator. Supabase remains data layer.
