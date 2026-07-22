# Test coverage policy (Layer B)

**Last updated:** 2026-07-22

## Goal

Drive **domain / service logic** toward 100% unit coverage on `@genie/api`, plus full FE/BE E2E.

## What unit coverage counts

Included via `collectCoverageFrom` in `apps/api/jest.config.js`:

- Services, repositories with logic, utils, chunking, providers used in MVP
- Config helpers (`env`, `version`)

## What is excluded (covered by integration / E2E instead)

| Excluded | Why |
|----------|-----|
| `*.module.ts`, `main.ts` | Nest DI wiring |
| `*.controller.ts` | Thin HTTP adapters — covered by `apps/api/test/*.e2e-spec.ts` + Playwright |
| `*.guard.ts`, `strategies/**` | Passport glue — covered by auth E2E |
| `dto/**` | class-validator metadata shells |
| `infrastructure/storage/**` | Unused until file-upload knowledge |
| `prisma.service.ts` | Generated client wrapper |

## Frontend

`@genie/web` has no unit test runner yet (Next.js). Layer B tracks Playwright E2E under `apps/e2e` for FE. Adding Vitest for pure utils is a follow-up.

## Commands

```bash
# API unit + coverage (enforces threshold in jest.config.js)
pnpm --filter @genie/api test -- --coverage

# API integration/e2e (Nest)
pnpm --filter @genie/api test:integration

# Full Playwright suite
pnpm test:e2e
```

## Thresholds

Current gate: statements/lines **90%**, functions **90%**, branches **75%**.

| Campaign | Date | Lines | Suites / tests |
|----------|------|-------|----------------|
| Campaign 1 | 2026-07-21 | ~65% | 21 / 103 |
| Campaign 2 | 2026-07-22 | ~**98%** | 24 / 191 |

Target: **100%** on the included set. Remaining gaps are mostly defensive branches (SSRF octet edges, abort mid-stream, empty ingest, appearance JSON fallbacks) — see latest Jest uncovered line report.

## Hard exclusions / blocked

- Nest DI wiring, controllers, guards, DTO shells, Prisma client wrapper, unused storage (per table above)
- `@genie/web` unit coverage deferred until Vitest (or similar) is added
