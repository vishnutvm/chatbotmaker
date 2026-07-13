# Vercel — Unified Web App (`apps/web`)

Single Vercel project for marketing, auth, and dashboard.

## Project settings

| Setting | Value |
|---------|--------|
| **Root Directory** | `apps/web` |
| **Framework** | Next.js |
| **Node.js** | 22.x |
| **Install** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Build** | `cd ../.. && pnpm turbo run build --filter=@genie/web` |

`apps/web/vercel.json` encodes install/build commands for monorepo builds from the app root.

## Environment variables

Set in Vercel → Project → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | NestJS API URL (e.g. Railway production URL) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |

Copy from `apps/web/.env.example` for local development.

## Domains

Recommended single-domain setup:

| Path | Experience |
|------|------------|
| `/` | Marketing |
| `/login`, `/signup` | Auth |
| `/dashboard/**` | SaaS app |

Optional: add `app.yourdomain.com` as alias; marketing can stay on apex.

## Migration from two Vercel projects

If you previously deployed `apps/marketing` and `apps/dashboard`:

1. Create or repoint one Vercel project to **Root Directory** `apps/web`.
2. Copy env vars from the old dashboard project (`NEXT_PUBLIC_*`).
3. Point production domain(s) to the unified project.
4. Archive or delete the old marketing and dashboard Vercel projects.

## Local parity

```bash
pnpm --filter @genie/web dev
# http://localhost:3000
```
