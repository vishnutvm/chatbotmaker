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
Marketing + Dashboard (Vercel — single app)
    |
    v
apps/web (port 3000 dev)
          NestJS API (Railway)
               |
       +-------+-------+
       |       |       |
       v       v       v
   Supabase  OpenAI  Stripe
```

---

## Services

### Vercel — Web (unified frontend)

| App | Root | Port (dev) |
|-----|------|------------|
| web | `apps/web` | 3000 |

See `docs/deployment/VERCEL_WEB.md`.

**Env vars:**
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

**Deploy branch:** `dev` (also `master` / `main` for CI).

```text
push to `dev` (vishnutvm/chatbotmaker)
  ├─ CI (.github/workflows/ci.yml)
  ├─ Frontend → Vercel project `chatbotmaker` (Git auto-deploy)
  │              Production URL: https://chatbotmaker-dev.vercel.app
  │              Set Vercel → Settings → Git → Production Branch = `dev`
  └─ Backend  → Mirror workflow → vishnuMChanthavila/chatbotmaker-deploy@main
                 → Railway project **genie-api** (cc493562-28cd-4b94-b4d7-d1afce1dba24)
                 → https://genie-api-production-4bb3.up.railway.app
```

Do **not** use Railway project `genie-api-production` for this app — wrong project / missing secrets.

`.github/workflows/ci.yml`:
1. Lint, typecheck, test, build
2. Docker build with PostgreSQL service container
3. Health check against container

Deploy triggers:
- **Vercel:** auto on push to `dev` (configure Production Branch = `dev`)
- **Railway:** push to `dev` → mirror to deploy repo `main` → Railway GitHub auto-deploy
- Optional GHA direct deploy: `ENABLE_RAILWAY_GHA_DEPLOY` / `VERCEL_TOKEN` (see workflow files)

---

## Local Development

```bash
pnpm install
# Configure apps/api/.env and apps/web/.env.local
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
