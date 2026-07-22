# Test coverage policy (Layer B)

**Last updated:** 2026-07-22 (Campaign 3)

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

## Frontend / widget

| App | Unit coverage |
|-----|----------------|
| `@genie/web` | No unit runner yet (Next.js). Layer B tracks Playwright E2E under `apps/e2e`. Vitest for pure utils is a follow-up. |
| `@genie/widget` | Node test runner + linkedom against built IIFE (`pnpm --filter @genie/widget test`). Campaign 3 expanded bubble/panel Shadow DOM paths (open/close, Escape, empty submit, theme=auto, XSS title). |

## Commands

```bash
# API unit + coverage (enforces threshold in jest.config.js)
pnpm --filter @genie/api test -- --coverage

# Widget unit / DOM (builds IIFE first)
pnpm --filter @genie/widget test

# API integration/e2e (Nest)
pnpm --filter @genie/api test:integration

# Full Playwright suite
pnpm test:e2e
```

## Thresholds

Current gate: statements/lines/functions **95%**, branches **80%**.

| Campaign | Date | Lines | Branches | Suites / tests |
|----------|------|-------|----------|----------------|
| Campaign 1 | 2026-07-21 | ~65% | ~53% | 21 / 103 |
| Campaign 2 | 2026-07-22 | ~**98.41%** | ~**82.7%** | 24 / 191 |
| Campaign 3 | 2026-07-22 | ~**99.88%** | ~**87.87%** | 24 / **216** |

Target: **100%** on the included set. **Not met** — see hard blocks below.

## Hard exclusions / blocked

- Nest DI wiring, controllers, guards, DTO shells, Prisma client wrapper, unused storage (per table above)
- `@genie/web` unit coverage deferred until Vitest (or similar) is added
- **`assistants.service` line ~475** (`octets.some(n > 255 \|\| NaN)`): unreachable under Node’s `URL` parser, which rejects invalid IPv4 literals before the SSRF ipv4 branch runs. Fail-closed via `new URL` catch instead. Documented; do not rewrite production code solely for that line.
- Remaining **branch** gaps (~12%) are mostly `||` / `??` / optional-chaining arms and constructor `Logger` lines — low product risk.
