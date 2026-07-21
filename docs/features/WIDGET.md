# Embeddable Widget (Phase 7)

**Status:** In progress — lightweight `widget.js` bundle foundation  
**Package:** `apps/widget` (`@genie/widget`)  
**Roadmap:** Phase 7 — Widget

## What this task ships

| Deliverable | Detail |
|-------------|--------|
| Minified IIFE | `pnpm --filter @genie/widget build` → `apps/widget/dist/widget.js` |
| Public API | `GenieWidget.init({ apiKey, assistantId })` |
| Validation | Both fields required non-empty strings; clear `GenieWidget: …` errors |
| Isolation | No Next.js / dashboard / React runtime in the bundle |
| Smoke | `fixtures/smoke.html` + `node --test scripts/widget.test.mjs` after build |

## Embed contract (script tag)

```html
<script src="https://cdn.example.com/widget.js"></script>
<script>
  GenieWidget.init({
    apiKey: 'YOUR_PUBLIC_KEY',
    assistantId: 'asst_…',
  });
</script>
```

**Notes**

- **CDN host** (Cloudflare) is deferred — local/CI use `dist/widget.js`.
- **`apiKey` auth** (`pk_live_…` issuance and server verification) is deferred.
- **Bubble / panel UI** is deferred — `init` currently validates and logs only.
- Global name is **`GenieWidget`** (IIFE `globalName`). Exported surface: `init`, `version`.

## Build & verify

```bash
pnpm --filter @genie/widget build
pnpm --filter @genie/widget test          # builds + node:test IIFE smoke (scripts/widget.test.mjs)
pnpm --filter @genie/widget typecheck
```

Open `apps/widget/fixtures/smoke.html` via a static file server rooted at `apps/widget` (so `../dist/widget.js` resolves), or point the script `src` at an absolute `file://` / hosted URL of `dist/widget.js`.

## Out of scope (later P7 P0s)

- Chat bubble + panel UI (light/dark)
- Public API key auth (`pk_live_…`)
- Dashboard embed snippet generator
- Cloudflare CDN hosting

## Architecture decisions

1. **tsup IIFE only** — third-party pages cannot consume ESM without a bundler; script-tag IIFE is the MVP contract.
2. **Zero runtime dependencies** — keeps payload small and avoids pulling monorepo app code into customer sites.
3. **Validate at `init`** — fail fast with explicit errors; do not silently no-op on bad config.
