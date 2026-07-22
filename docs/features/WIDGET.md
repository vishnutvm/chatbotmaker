# Embeddable Widget (Phase 7)

**Status:** In progress — `pk_live` auth + dashboard embed snippet generator  
**Package:** `apps/widget` (`@genie/widget`)  
**Roadmap:** Phase 7 — Widget

## What this task ships

| Deliverable | Detail |
|-------------|--------|
| Minified IIFE | `pnpm --filter @genie/widget build` → `apps/widget/dist/widget.js` |
| Public API | `GenieWidget.init` / `open` / `close` / `destroy` / `version` |
| Bubble + panel | Floating FAB + Shadow DOM chat panel |
| **`pk_live` auth** | Client validates `pk_live_…`; calls public bootstrap with `X-Genie-Public-Key` |
| **Dashboard embed snippet** | Deploy tab + wizard — create `pk_live`, copy HTML snippet |
| Themes | `theme: 'light' \| 'dark' \| 'auto'` (default `auto`) |
| Isolation | No Next.js / dashboard / React runtime in the bundle |
| Smoke | `fixtures/smoke.html` + `node --test scripts/widget.test.mjs` after build |

## Embed contract (script tag)

```html
<script src="https://cdn.example.com/widget.js"></script>
<script>
  GenieWidget.init({
    apiKey: 'pk_live_…',
    assistantId: 'uuid',
    apiBaseUrl: 'https://your-api.example', // optional
    theme: 'auto',
    title: 'Chat', // optional; defaults to assistant name from bootstrap
  });
</script>
```

**Notes**

- **CDN host** (Cloudflare) is deferred — set `NEXT_PUBLIC_WIDGET_SCRIPT_URL` in Vercel when `widget.js` is hosted.
- **Key issuance:** owner/admin `POST /api/v1/organizations/:id/public-keys` (see `docs/api/publishable-keys.md`).
- **Dashboard UI:** `apps/web` Deploy tab (`/dashboard/assistants/:id/deploy`) — `EmbedSnippetPanel` lists keys, creates `pk_live`, builds snippet via `buildEmbedSnippet`.
- **Bootstrap:** `GET /api/v1/public/widget/bootstrap?assistantId=…` with `X-Genie-Public-Key` (see `docs/api/widget-public.md`).
- **Live chat / SSE** is deferred — composer shows a local placeholder assistant reply after bootstrap succeeds.
- Global name is **`GenieWidget`**. Exported surface: `init`, `open`, `close`, `destroy`, `version`.

## Dashboard embed snippet generator

| Location | Path |
|----------|------|
| Assistant Deploy tab | `apps/web/features/dashboard/pages/assistant-deploy.tsx` |
| Create wizard (deploy step) | `apps/web/features/dashboard/pages/wizard-deploy.tsx` |
| Shared UI | `apps/web/features/dashboard/components/embed-snippet-panel.tsx` |
| Snippet builder | `apps/web/lib/embed-snippet.ts` |
| Widget script URL | `NEXT_PUBLIC_WIDGET_SCRIPT_URL` → `apps/web/lib/widget-config.ts` |
| API client | `createPublishableKeysClient` in `@genie/api-client` |

**Flow**

1. Owner opens Deploy tab for a **live** assistant.
2. Panel loads org publishable keys (`GET …/public-keys`).
3. If no usable plaintext key in session, user clicks **Create publishable key** (`POST …/public-keys`).
4. Plaintext `pk_live_…` is shown once; stored in `sessionStorage` for the session.
5. User copies generated HTML (script src + `GenieWidget.init` with `apiKey`, `assistantId`, `apiBaseUrl`).

**UI states:** loading, error (retry), empty (create key), not-live (deploy first), ready (snippet + copy).

## Auth UI states

1. **Loading** — Connecting…; composer disabled while bootstrap runs.
2. **Ready** — Welcome message applied; composer enabled.
3. **Error** — Invalid/revoked key, missing assistant, or network; clear in-panel message.

## Build & verify

```bash
pnpm --filter @genie/widget build
pnpm --filter @genie/widget test
pnpm --filter @genie/widget typecheck
pnpm --filter @genie/web test   # embed-snippet unit tests
```

## Out of scope (later P7 P0s)

- Cloudflare CDN hosting
- Live assistant streaming over the public widget API

## Architecture decisions

1. **tsup IIFE only** — script-tag embed without a bundler.
2. **Zero runtime dependencies** — small payload.
3. **Shadow DOM** — style isolation.
4. **Header auth** — never put `pk_live` in query strings.
5. **Tenant from key** — server derives org from hashed key; assistant must be `live` and same-org.
6. **Snippet builder in web lib** — pure function `buildEmbedSnippet`; no secrets in repo.
