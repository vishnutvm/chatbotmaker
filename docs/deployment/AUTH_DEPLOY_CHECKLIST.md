# Auth Deploy Checklist

Required for login → onboard → dashboard on production.

## Vercel (`apps/web`)

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://genie-api-production-4bb3.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

**Root Directory:** `apps/web`

## Railway API

| Variable | Example |
|----------|---------|
| `CORS_ORIGINS` | `https://chatbotmaker-dev.vercel.app,http://localhost:3000` |
| `SUPABASE_URL` | **Required.** `https://rocxcjxaqceqndkymujl.supabase.co` (must match Vercel) |
| `NODE_ENV` | `production` |
| `SUPABASE_JWT_SECRET` | Only for local/CI (`http://` Supabase). **Hosted Supabase uses JWKS automatically.** |
| `DATABASE_URL` | Supabase **pooler** URL on port **6543** with `?pgbouncer=true` (required — without it Prisma throws `prepared statement already exists` / onboard 500) |
| `DIRECT_URL` | Supabase **direct** DB URL on port **5432** (migrations) |

## Supabase → Authentication → URL Configuration

| Setting | Value |
|---------|--------|
| **Site URL** | `https://chatbotmaker-dev.vercel.app` |
| **Redirect URLs** | `https://chatbotmaker-dev.vercel.app/auth/callback` |
| | `https://chatbotmaker-dev.vercel.app/update-password` |
| | `http://localhost:3000/auth/callback` |
| | `http://localhost:3000/update-password` |

Remove old `chatbotmaker-dashboard-seven.vercel.app` URLs.

## Expected auth flow

```text
/login or /signup
  → Supabase auth (email or Google)
  → GET /api/v1/auth/session
  → if !onboarded → /signup?onboard=1
  → POST /api/v1/auth/onboard
  → /dashboard
```

## If onboard returns 401 but session returns 200

`session` tolerates invalid tokens; `onboard` requires a valid Supabase JWT.

- Hosted Supabase: API must use the project URL (`SUPABASE_URL=https://….supabase.co`) so JWKS verification runs.
- CI dual-mode: when `SUPABASE_JWT_SECRET` is **explicitly** set alongside a hosted URL, HS256 test tokens are also accepted (E2E `signTestJwt`). Do **not** set `SUPABASE_JWT_SECRET` on production Railway for hosted projects — JWKS only.
- Confirm email: if signup never reaches `/dashboard`, disable Confirm email or set `E2E_SUPABASE_SERVICE_ROLE_KEY` so CI can admin-confirm.

1. Railway `SUPABASE_URL` must match Vercel `NEXT_PUBLIC_SUPABASE_URL` (same project).
2. For `https://*.supabase.co`, the API verifies JWTs via **JWKS** — redeploy after setting `SUPABASE_URL`.
3. Do not point `SUPABASE_URL` at `http://127.0.0.1` in production.

1. `https://chatbotmaker-dev.vercel.app/login` — form loads
2. Google or email login — lands on `/signup?onboard=1` (new user) or `/dashboard` (returning)
3. Complete onboard — redirects to `/dashboard` with sidebar user name
4. Network tab: no CORS errors on `session` or `onboard`
