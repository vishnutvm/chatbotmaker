# Sprint 1 — Foundation

**Status:** Complete (code scaffold) — infra tasks remain for human  
**Completed:** 2026-07-02
**Roadmap phase:** 1 — Foundation  
**Notion phase:** [Phase 1 — Foundation](https://app.notion.com/p/391d48599a9981069208c6d704285815)

## Goal

Turborepo monorepo scaffold with local dev for marketing, dashboard shell, and API health check.

## Deliverable

- `pnpm install` at repo root succeeds
- `pnpm dev` runs marketing (:3000), dashboard (:3001), API (:4000)
- `pnpm build` and `pnpm lint` pass on scaffold
- Marketing site unchanged functionally (moved to `apps/marketing`)
- CI workflow runs lint + build on PR

## In scope

1. Turborepo + pnpm workspaces
2. Move `dashboard/` → `apps/marketing/`
3. Scaffold `apps/dashboard`, `apps/api`, `apps/widget`
4. Scaffold `packages/types`, `ui`, `config`, `api-client`
5. Shared TypeScript / Prettier config
6. `.env.example` files
7. GitHub Actions CI

## Out of scope (human / infra — separate tasks)

- GitHub repo creation / branch protection
- Vercel project reconfiguration
- AWS account structure
- MongoDB / Redis / S3 provisioning

## Review gates

| Gate | Status | Notes |
|------|--------|-------|
| Requirements | ✅ | Roadmap Phase 0 exit criteria |
| Architecture | ✅ | ADR 0001, 0002; Docs/07 |
| API contract | N/A | Health only — documented inline |
| DB review | N/A | No schema this sprint |
| UI plan | ✅ | Dashboard auth shell placeholder |
| Cost/performance | ✅ | Scaffold only; no cloud spend |

## Tests

| Layer | Scope |
|-------|--------|
| Unit | API health controller |
| Integration | API GET /health e2e (supertest) |
| E2E | Deferred — no user flows yet |

## Task order

1. Monorepo root config
2. Move marketing app
3. Shared packages
4. API scaffold + health test
5. Dashboard shell
6. Widget placeholder
7. CI + env examples
8. Verify build/lint

## Verification results

| Check | Result |
|-------|--------|
| `pnpm install` | ✅ |
| `pnpm build` | ✅ (marketing, dashboard, api, widget) |
| `pnpm lint` | ✅ (marketing warnings only — refactor backlog) |
| `pnpm typecheck` | ✅ |
| `pnpm test` | ✅ (6 tests — health unit + e2e) |

## Remaining (human / infra)

- GitHub repo + branch protection
- Vercel re-point to `apps/marketing`
- AWS / MongoDB / Redis / S3 provisioning
- Remove orphan `dashboard/.git` and nested `apps/marketing/.git` when consolidating git
