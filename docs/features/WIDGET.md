# Embeddable Widget (Phase 7)

**Status:** In progress — bubble + panel UI on `widget.js`  
**Package:** `apps/widget` (`@genie/widget`)  
**Roadmap:** Phase 7 — Widget

## What this task ships

| Deliverable | Detail |
|-------------|--------|
| Minified IIFE | `pnpm --filter @genie/widget build` → `apps/widget/dist/widget.js` |
| Public API | `GenieWidget.init` / `open` / `close` / `destroy` / `version` |
| Bubble + panel | Floating FAB + Shadow DOM chat panel (header, messages, composer) |
| Themes | `theme: 'light' \| 'dark' \| 'auto'` (default `auto`) |
| Validation | Required `apiKey` + `assistantId`; optional `theme` / `title` |
| Isolation | No Next.js / dashboard / React runtime in the bundle |
| Smoke | `fixtures/smoke.html` + `node --test scripts/widget.test.mjs` after build |

## Embed contract (script tag)

```html
<script src="https://cdn.example.com/widget.js"></script>
<script>
  GenieWidget.init({
    apiKey: 'YOUR_PUBLIC_KEY',
    assistantId: 'asst_…',
    theme: 'auto', // optional: light | dark | auto
    title: 'Chat', // optional panel heading
  });
</script>
```

**Notes**

- **CDN host** (Cloudflare) is deferred — local/CI use `dist/widget.js`.
- **`apiKey` auth** (`pk_live_…` issuance and server verification) is deferred.
- **Live chat / SSE** is deferred — composer shows a local placeholder assistant reply.
- Global name is **`GenieWidget`** (IIFE `globalName`). Exported surface: `init`, `open`, `close`, `destroy`, `version`.

## UI behavior

1. `init` mounts `#genie-widget-root` on `document.body` with an open Shadow DOM.
2. Bubble toggles the panel; `Escape` / header close / `GenieWidget.close()` hide it.
3. Re-`init` destroys the previous mount (single instance).
4. Messages use `textContent` (XSS-safe); host CSS cannot restyle internals.

## Build & verify

```bash
pnpm --filter @genie/widget build
pnpm --filter @genie/widget test          # builds + node:test IIFE smoke (scripts/widget.test.mjs)
pnpm --filter @genie/widget typecheck
```

Open `apps/widget/fixtures/smoke.html` via a static file server rooted at `apps/widget` (so `../dist/widget.js` resolves), or point the script `src` at an absolute `file://` / hosted URL of `dist/widget.js`.

## Out of scope (later P7 P0s)

- Public API key auth (`pk_live_…`)
- Dashboard embed snippet generator
- Cloudflare CDN hosting
- Live assistant streaming over the public widget API

## Architecture decisions

1. **tsup IIFE only** — third-party pages cannot consume ESM without a bundler; script-tag IIFE is the MVP contract.
2. **Zero runtime dependencies** — keeps payload small and avoids pulling monorepo app code into customer sites.
3. **Shadow DOM** — style isolation from host pages; light/dark via `data-theme`.
4. **Validate at `init`** — fail fast with explicit errors; do not silently no-op on bad config.
