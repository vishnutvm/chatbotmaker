# Vercel — Unified Web App (`apps/web`)

Single Vercel project for marketing, auth, and dashboard.

## Project settings

| Setting | Value |
|---------|--------|
| **Project** | `chatbotmaker` |
| **Production URL** | https://chatbotmaker-dev.vercel.app |
| **Production Branch** | `main` |
| **Root Directory** | `apps/web` |
| **Framework** | Next.js |
| **Node.js** | 22.x / 24.x |
| **Install** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Build** | `cd ../.. && pnpm turbo run build --filter=@genie/web` |

`apps/web/vercel.json` encodes install/build commands for monorepo builds from the app root.

### Set Production Branch to `main`

Vercel Dashboard → Project **chatbotmaker** → **Settings** → **Git** → **Production Branch** → `main`.

After that, every push to `main` on `vishnutvm/chatbotmaker` deploys production frontend.

(`dev` is no longer the production deploy branch.)

## Environment variables

Set in Vercel → Project → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | NestJS API URL (Cloud Run: `https://genie-api-dev-509947078893.asia-south1.run.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_WIDGET_SCRIPT_URL` | No | Public `widget.js` URL for dashboard embed snippets (default placeholder until CDN) |

Copy from `apps/web/.env.example` for local development.

## Domains

Recommended single-domain setup:

| Path | Experience |
|------|------------|
| `/` | Marketing |
| `/login`, `/signup` | Auth |
| `/dashboard/**` | SaaS app |

Optional: add `app.yourdomain.com` as alias; marketing can stay on apex.

## Local parity

```bash
pnpm --filter @genie/web dev
# http://localhost:3000
```
