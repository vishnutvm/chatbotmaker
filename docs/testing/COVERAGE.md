# Test coverage policy (Layer B)

**Last updated:** 2026-07-23 (Campaign 7)

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
| `@genie/widget` | Node test runner + linkedom against built IIFE (`scripts/widget.test.mjs`) **plus** direct `chat-stream.ts` unit tests via `tsx` (`scripts/chat-stream.test.mjs`, Campaign 7). Campaign 3 expanded bubble/panel Shadow DOM paths; Campaign 7 covers SSE parser, HTTP/SSE error mapping, abort, and unsupported body. |

## Commands

```bash
# API unit + coverage (enforces threshold in jest.config.js)
pnpm --filter @genie/api test -- --coverage

# Widget unit / DOM (builds IIFE first) + chat-stream helpers
pnpm --filter @genie/widget test

# API client publishable-keys client (mock fetch)
pnpm --filter @genie/api-client test

# Web embed utils
pnpm --filter @genie/web test

# API integration/e2e (Nest) — requires local Postgres (docker-compose.test.yml)
pnpm --filter @genie/api test:integration

# Full Playwright suite
pnpm test:e2e
```

## Thresholds

Current gate: statements/lines/functions **95%**, branches **80%**.

| Campaign | Date | Lines | Stmts | Funcs | Branches | API unit | Widget (IIFE+stream) | Web embed | API client |
|----------|------|-------|-------|-------|----------|----------|----------------------|-----------|------------|
| Campaign 1 | 2026-07-21 | ~65% | — | — | ~53% | 103 | — | — | — |
| Campaign 2 | 2026-07-22 | ~98.41% | — | — | ~82.7% | 191 | — | — | — |
| Campaign 3 | 2026-07-22 | ~99.88% | — | — | ~87.87% | 216 | — | — | — |
| Campaign 4 | 2026-07-22 | 99.79% | 98.97% | 99.54% | 87.43% | 257 | — | 6 | — |
| Campaign 5 | 2026-07-22 | 99.89% | 99.06% | 99.54% | 87.26% | 258 | — | 17 | 6 |
| Campaign 6 | 2026-07-23 | 99.89% | 99.06% | 99.54% | 88.65% | 264 | 29 IIFE | 31 | 6 |
| **Campaign 7** | 2026-07-23 | **99.91%** | **99.58%** | **99.57%** | **90.06%** | **317** | **29 IIFE + 15 stream** | **31** | **6** |

Target: **100%** on the included set. **Not met** — see hard blocks below.

### Campaign 7 focus (P7 widget streaming)

- **`pipe-ai-sse`** — empty stream, client disconnect before first event, mid-stream abort, AbortError swallow, pre-stream JSON errors (429 Retry-After, string/object HttpException, generic 500), mid-stream SSE `error` mapping (503 `AI_NOT_CONFIGURED`, string body, default provider error).
- **`ai-actor`** — dedicated unit tests for `memberActor` / `organizationActor` / `actorUserId`.
- **`widget-chat.service`** — already at 100% (resolve-before-RL ordering); left intact.
- **`publishable-key-rate-limiter`** — `assertWithinLimits` → `assertBootstrap` legacy alias.
- **`assistants.service` / `ai.service` / `rag-retrieval`** — public-stream abort paths, update field trims, embed AbortError, post-embed abort.
- **`apps/widget` `chat-stream.ts`** — direct unit suite (HTTP/SSE visitor-safe messages, SSE parser chunking, fetch abort, unsupported body, unexpected end).
- **Local integration / full Playwright** — blocked on this machine (no Docker / no Postgres on `:5432`). CI `build` + `e2e` jobs remain the source of truth for Nest integration + Playwright.

### Campaign 6 focus

- **Widget CDN HTTPS validation** — direct `isHttpsWidgetScriptUrl` tests; accept live GCS URL `https://storage.googleapis.com/genie-widget/widget.js`; reject ftp/data/file/ws/javascript/malformed.
- **Embed snippet** — GCS `src`, angle-bracket HTML escape, blank `apiBaseUrl`, non-https reject beyond `http:`.
- **API branch micro-fills** — `version` SHA env priority, `cors-public-path` empty path, `env` empty pepper / empty CORS → localhost, `ai.service` missing id/model/content fallbacks.
- **Skipped** — deploy scripts under `scripts/` (infra; low unit value).

## Hard exclusions / blocked

- Nest DI wiring, controllers, guards, DTO shells, Prisma client wrapper, unused storage (per table above)
- **`deploy-method-picker.tsx`**, **`embed-snippet-panel.tsx`** — React client components; require Vitest + React Testing Library (or expanded authenticated Playwright flows). Route guards + publishable-keys API covered by E2E.
- **`assistants.service` line ~603** (`octets.some(n > 255 || NaN)`): unreachable under Node’s `URL` parser, which rejects invalid IPv4 literals before the SSRF ipv4 branch runs. Fail-closed via `new URL` catch instead. Documented; do not rewrite production code solely for that line.
- Remaining **branch** gaps (~10%) are mostly `||` / `??` / optional-chaining arms and constructor `Logger` lines — low product risk.
- **Deploy / CDN shell scripts** (`scripts/deploy-widget-cdn.*`, Cloud Run helpers) — operational; covered by docs + manual/CI deploy, not Jest.
- **Campaign 7 local env** — Docker Desktop / `docker-compose.test.yml` Postgres not available on the campaign runner host; Nest `test:integration` and full-stack Playwright deferred to GitHub Actions on the PR.
