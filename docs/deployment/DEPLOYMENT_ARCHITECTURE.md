# Deployment Architecture

**Last Updated:** 2026-07-22

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
apps/web
          NestJS API (Railway)
               |
       +-------+-------+
       |       |       |
       v       v       v
   Supabase  OpenAI  Stripe
```

---

## Deploy branch policy (canonical)

**Both frontend and backend deploy from `main` only.**

| Surface | Host | Trigger |
|---------|------|---------|
| Web | Vercel project `chatbotmaker` | Push to `main` (Production Branch = `main`) |
| API | Railway project `genie-api` | Push to `main` (GitHub source = `vishnutvm/chatbotmaker`) |
| Widget CDN | Cloudflare R2 (`cdn.<domain>/widget.js`) | `scripts/deploy-widget-cdn.sh` + GHA artifact; R2 when `ENABLE_WIDGET_CDN_DEPLOY` |

There is **no** deploy-mirror repo. Do not reintroduce `mirror-deploy-repo.yml`.

```text
push to `main` (vishnutvm/chatbotmaker)
  ├─ CI (.github/workflows/ci.yml)
  ├─ Frontend → Vercel Git auto-deploy → https://chatbotmaker-dev.vercel.app
  ├─ Backend  → Railway Git auto-deploy → https://genie-api-production-4bb3.up.railway.app
  └─ Widget   → Deploy Widget CDN workflow → artifact (+ R2 when secrets set)
```

Optional GitHub Actions CLI deploys (disabled unless vars are set):

- `Deploy API` — `ENABLE_RAILWAY_GHA_DEPLOY=true` + `RAILWAY_TOKEN`
- `Deploy Web` — `ENABLE_VERCEL_GHA_DEPLOY=true` + `VERCEL_TOKEN`
- `Deploy Widget CDN` — always builds artifact; R2 when `ENABLE_WIDGET_CDN_DEPLOY=true` + Cloudflare secrets

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
- `NEXT_PUBLIC_WIDGET_SCRIPT_URL` — Cloudflare CDN URL for embed snippets (`https://cdn.<domain>/widget.js`; see `docs/deployment/WIDGET_CDN.md`)

### Cloudflare R2 — Widget CDN

| Artifact | Path | Public URL pattern |
|----------|------|--------------------|
| `widget.js` | `apps/widget/dist/widget.js` | `https://cdn.<your-domain>/widget.js` |

See `docs/deployment/WIDGET_CDN.md` and ADR `docs/adr/0005-widget-cdn-cloudflare-r2.md`.

### Railway — API

| Setting | Value |
|---------|-------|
| Project | `genie-api` (`cc493562-28cd-4b94-b4d7-d1afce1dba24`) |
| GitHub source | `vishnutvm/chatbotmaker` @ `main` |
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

Turn off **Wait for CI** on the Railway service if GitHub pushes stay SKIPPED.

Do **not** use Railway project `genie-api-production` for this app — wrong project / missing secrets.

### Supabase

Create project at [supabase.com](https://supabase.com). Enable:
- PostgreSQL
- Auth (email/password)
- Storage buckets: `knowledge`, `avatars`, `exports`
- pgvector extension

---

## CI

`.github/workflows/ci.yml`:
1. Lint, typecheck, test, build
2. Docker build with PostgreSQL service container
3. Health check against container

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

1. Revert git commit on `main`
2. Re-deploy previous Railway / Vercel deployment
3. Prisma migrations are forward-only; write down migration for rollback if needed

---

## Future: AWS ECS

Trigger: sustained high traffic, custom networking, or compliance requirements.
Migration: same Docker image, different orchestrator. Supabase remains data layer.
