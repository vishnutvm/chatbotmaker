# @genie/widget

Embeddable Genie chat widget (Phase 7).

## Build

```bash
pnpm --filter @genie/widget build
# → dist/widget.js (minified IIFE, global `GenieWidget`)
```

## CDN (Cloudflare R2)

Production embed script URL pattern:

```text
https://cdn.<your-domain>/widget.js
```

Publish:

```bash
./scripts/deploy-widget-cdn.sh
# or
./scripts/deploy-widget-cdn.ps1
```

See [docs/deployment/WIDGET_CDN.md](../../docs/deployment/WIDGET_CDN.md) and [ADR 0005](../../docs/adr/0005-widget-cdn-cloudflare-r2.md).

Dashboard snippets read `NEXT_PUBLIC_WIDGET_SCRIPT_URL` (placeholder until CDN is live).

## Usage (host page)

```html
<script src="https://cdn.<your-domain>/widget.js"></script>
<script>
  GenieWidget.init({
    apiKey: 'pk_live_…',
    assistantId: '…',
    theme: 'auto',
    title: 'Chat',
  });
</script>
```

Public API: `init`, `open`, `close`, `destroy`, `version`.

See [docs/features/WIDGET.md](../../docs/features/WIDGET.md) for the embed contract.

## Smoke

```bash
pnpm --filter @genie/widget test
# or open fixtures/smoke.html after build (serve apps/widget)
```
