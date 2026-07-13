# Frontend Migration Status

**Current phase:** 34 — Final validation  
**Last updated:** 2026-07-13

## Completed

- [x] Clone agentbloom-io
- [x] Scaffold `apps/web`
- [x] Port UI components (shadcn, shell, common)
- [x] Convert 27 dashboard pages from TanStack → Next.js
- [x] Migrate marketing landing
- [x] Migrate auth (login, signup, OAuth callback)
- [x] `pnpm --filter @genie/web build` — **PASS**
- [x] `pnpm --filter @genie/web typecheck` — **PASS**
- [x] `pnpm --filter @genie/web lint` — **PASS**
- [x] E2E config + tests updated for `@genie/web`
- [x] Vercel config — `apps/web/vercel.json` + `docs/deployment/VERCEL_WEB.md`
- [x] **Deleted** `apps/dashboard` and `apps/marketing`

## Remaining

- [ ] Privacy / terms pages in `apps/web`
- [ ] Wire API client (replace mock store)
- [ ] **Vercel dashboard:** set Root Directory to `apps/web` and env vars (human step)
- [ ] Archive old Vercel projects (marketing + dashboard)

## Known issues

- Dashboard uses mock data (`lib/store.ts`) until assistants API is connected

## Next action

1. In Vercel: Root Directory → `apps/web`, copy `NEXT_PUBLIC_*` env vars
2. Point production domain to unified project
3. Wire real API data in dashboard pages
