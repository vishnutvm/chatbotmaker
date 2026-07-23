# Test coverage policy (Layer B)

**Last updated:** 2026-07-23 (Campaign 6)

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
| `@genie/web` | Node test runner for pure utils (`embed-snippet.ts`, `widget-config.ts`). Campaign 6 added direct `isHttpsWidgetScriptUrl` coverage (GCS CDN accept + ftp/data/malformed reject) and embed-snippet CDN edge cases. React dashboard components tracked via Playwright E2E. Vitest + RTL for `deploy-method-picker` / `embed-snippet-panel` is a follow-up. |
| `@genie/widget` | Node test runner + linkedom against built IIFE (`pnpm --filter @genie/widget test`). Campaign 3 expanded bubble/panel Shadow DOM paths (open/close, Escape, empty submit, theme=auto, XSS title). |

## Commands

```bash
# API unit + coverage (enforces threshold in jest.config.js)
pnpm --filter @genie/api test -- --coverage

# Widget unit / DOM (builds IIFE first)
pnpm --filter @genie/widget test

# API client publishable-keys client (mock fetch)
pnpm --filter @genie/api-client test

# Web embed utils
pnpm --filter @genie/web test

# API integration/e2e (Nest)
pnpm --filter @genie/api test:integration

# Full Playwright suite
pnpm test:e2e
```

## Thresholds

Current gate: statements/lines/functions **95%**, branches **80%**.

| Campaign | Date | Lines | Stmts | Funcs | Branches | API unit | Web embed | API client |
|----------|------|-------|-------|-------|----------|----------|-----------|------------|
| Campaign 1 | 2026-07-21 | ~65% | — | — | ~53% | 103 | — | — |
| Campaign 2 | 2026-07-22 | ~98.41% | — | — | ~82.7% | 191 | — | — |
| Campaign 3 | 2026-07-22 | ~99.88% | — | — | ~87.87% | 216 | — | — |
| Campaign 4 | 2026-07-22 | 99.79% | 98.97% | 99.54% | 87.43% | 257 | 6 | — |
| Campaign 5 | 2026-07-22 | 99.89% | 99.06% | 99.54% | 87.26% | 258 | 17 | 6 |
| **Campaign 6** | 2026-07-23 | **99.89%** | **99.06%** | **99.54%** | **88.65%** | **264** | **31** | **6** |

Target: **100%** on the included set. **Not met** — see hard blocks below.

### Campaign 6 focus

- **Widget CDN HTTPS validation** — direct `isHttpsWidgetScriptUrl` tests; accept live GCS URL `https://storage.googleapis.com/genie-widget/widget.js`; reject ftp/data/file/ws/javascript/malformed.
- **Embed snippet** — GCS `src`, angle-bracket HTML escape, blank `apiBaseUrl`, non-https reject beyond `http:`.
- **API branch micro-fills** — `version` SHA env priority, `cors-public-path` empty path, `env` empty pepper / empty CORS → localhost, `ai.service` missing id/model/content fallbacks.
- **Skipped** — deploy scripts under `scripts/` (infra; low unit value).

## Hard exclusions / blocked

- Nest DI wiring, controllers, guards, DTO shells, Prisma client wrapper, unused storage (per table above)
- **`deploy-method-picker.tsx`**, **`embed-snippet-panel.tsx`** — React client components; require Vitest + React Testing Library (or expanded authenticated Playwright flows). Route guards + publishable-keys API covered by E2E.
- **`assistants.service` line ~497** (`octets.some(n > 255 || NaN)`): unreachable under Node’s `URL` parser, which rejects invalid IPv4 literals before the SSRF ipv4 branch runs. Fail-closed via `new URL` catch instead. Documented; do not rewrite production code solely for that line.
- Remaining **branch** gaps (~11%) are mostly `||` / `??` / optional-chaining arms and constructor `Logger` lines — low product risk.
- **Deploy / CDN shell scripts** (`scripts/deploy-widget-cdn.*`, Cloud Run helpers) — operational; covered by docs + manual/CI deploy, not Jest.
