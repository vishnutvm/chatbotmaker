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
| `SUPABASE_URL` | Same as Vercel `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_JWT_SECRET` | Supabase → Settings → API → JWT Secret |
| `DATABASE_URL` | Supabase Postgres connection string |

## Supabase → Authentication → URL Configuration

| Setting | Value |
|---------|--------|
| **Site URL** | `https://chatbotmaker-dev.vercel.app` |
| **Redirect URLs** | `https://chatbotmaker-dev.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` |

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

## Verify

1. `https://chatbotmaker-dev.vercel.app/login` — form loads
2. Google or email login — lands on `/signup?onboard=1` (new user) or `/dashboard` (returning)
3. Complete onboard — redirects to `/dashboard` with sidebar user name
4. Network tab: no CORS errors on `session` or `onboard`
