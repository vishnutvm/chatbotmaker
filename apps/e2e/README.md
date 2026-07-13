# E2E Tests (`@genie/e2e`)

Playwright end-to-end tests for `apps/web` + `apps/api`.

## Suites

| File | Requires | What it covers |
|------|----------|----------------|
| `smoke.spec.ts` | Web app | Marketing, login/signup forms |
| `auth-guards.spec.ts` | Web app | Protected routes → login |
| `auth-api.spec.ts` | API + Postgres | onboard → session → me |
| `auth-flow.spec.ts` | Supabase + API + Postgres | Full UI signup/login/logout |
| `create-assistant.spec.ts` | Auth session | Wizard UI (skips if logged out) |

## Run locally

```bash
# 1. Postgres on 5432 with database genie_ci
# 2. Build apps
pnpm build

# 3. Install browsers (once)
pnpm --filter @genie/e2e exec playwright install chromium

# Smoke only (no Postgres required)
E2E_WEB_ONLY=true pnpm --filter @genie/e2e exec playwright test --project=web

# Full stack (Postgres required on :5432)
pnpm --filter @genie/e2e test
```

### Full auth UI tests

Set real Supabase credentials:

```bash
E2E_SUPABASE_URL=https://xxx.supabase.co E2E_SUPABASE_ANON_KEY=eyJ... pnpm --filter @genie/e2e test tests/auth-flow.spec.ts
```

## CI

GitHub Actions job `e2e` runs after build + migrations. Set secrets:

- `E2E_SUPABASE_URL`
- `E2E_SUPABASE_ANON_KEY`

`auth-api` and smoke/guards run without Supabase secrets.

## Production parity (Railway)

After auth or deploy changes, verify production config matches `docs/deployment/AUTH_DEPLOY_CHECKLIST.md`:

- Railway `CORS_ORIGINS` includes your Vercel URL
- Supabase redirect URLs point to `apps/web` domain
