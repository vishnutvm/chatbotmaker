# E2E Testing

Automated UI and API tests for Genie auth flows.

## Test layers

| Layer | Location | What it tests |
|-------|----------|----------------|
| API unit | `apps/api/src/**/*.spec.ts` | Services, helpers |
| API integration | `apps/api/test/*.e2e-spec.ts` | Auth, tenant isolation, health |
| UI E2E | `apps/e2e/tests/*.spec.ts` | Playwright browser flows |

## Run locally

### API integration only (needs PostgreSQL)

```bash
# Start local postgres or use Supabase DIRECT_URL
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/genie_dev
export DIRECT_URL=$DATABASE_URL
export SUPABASE_JWT_SECRET=ci-test-jwt-secret-minimum-32-characters

cd apps/api
npx prisma migrate deploy
pnpm test
```

### UI smoke tests (starts API + dashboard automatically)

```bash
pnpm build
pnpm --filter @genie/e2e test tests/smoke.spec.ts
```

### Full UI auth flow (requires real Supabase)

1. Disable email confirmation in Supabase Auth (dev), or use auto-confirm
2. Copy `apps/e2e/.env.example` values
3. Run:

```bash
export E2E_SUPABASE_URL=https://rocxcjxaqceqndkymujl.supabase.co
export E2E_SUPABASE_ANON_KEY=<your-anon-key>
export SUPABASE_JWT_SECRET=<same-as-railway>

pnpm build
pnpm test:e2e
```

## CI

- **build** job: API integration tests (auth + tenant isolation)
- **e2e** job: Playwright smoke tests always; full auth UI when GitHub secrets are set:
  - `E2E_SUPABASE_URL`
  - `E2E_SUPABASE_ANON_KEY`

## GitHub secrets (optional, for full UI auth in CI)

| Secret | Value |
|--------|--------|
| `E2E_SUPABASE_URL` | `https://rocxcjxaqceqndkymujl.supabase.co` |
| `E2E_SUPABASE_ANON_KEY` | Supabase anon key |
