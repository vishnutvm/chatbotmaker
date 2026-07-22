# @genie/widget

Embeddable Genie chat widget (Phase 7).

## Build

```bash
pnpm --filter @genie/widget build
# → dist/widget.js (minified IIFE, global `GenieWidget`)
```

## Usage (host page)

```html
<script src="/path/to/widget.js"></script>
<script>
  GenieWidget.init({
    apiKey: '…',
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
