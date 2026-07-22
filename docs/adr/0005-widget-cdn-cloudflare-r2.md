# ADR 0005 — Widget CDN via Cloudflare R2

- **Status:** accepted
- **Date:** 2026-07-22
- **Phase:** 7 — Widget

## Context

Dashboard embed snippets need a stable public URL for `widget.js` (`NEXT_PUBLIC_WIDGET_SCRIPT_URL`). The MVP infrastructure blueprint already lists **Cloudflare** for DNS/CDN (including the widget). We need a concrete hosting path without introducing AWS CloudFront, S3, or other non-blueprint CDNs.

## Options

1. **Cloudflare R2 + custom domain (CDN)** — object storage as origin; Cloudflare edge caches `widget.js`.
2. **Cloudflare Pages (static project)** — deploy `dist/` as a Pages site; good for multi-file static sites, heavier for a single artifact.
3. **Serve from Vercel `apps/web/public`** — couples widget release cadence to Next.js deploys; weak cache control for third-party embeds; not the blueprint “widget CDN” path.

## Decision

Use **Cloudflare R2** as the origin for the minified IIFE, exposed through a **Cloudflare custom domain** (preferred) or R2 public base URL during bootstrap:

```text
https://cdn.<your-domain>/widget.js
```

Upload via Wrangler (`wrangler r2 object put`) from:

- Manual scripts: `scripts/deploy-widget-cdn.sh` / `.ps1`
- Optional GitHub Actions: `.github/workflows/deploy-widget-cdn.yml` (gated on Cloudflare secrets)

Set Vercel `NEXT_PUBLIC_WIDGET_SCRIPT_URL` to the public URL after the first successful publish.

## Consequences

- Stays inside the Cloudflare MVP blueprint (no new cloud vendor).
- Requires Cloudflare account + API token + **dedicated** R2 bucket (secrets not in repo).
- Until secrets exist, CI still **builds and uploads a GitHub Actions artifact**; dashboard keeps the placeholder URL.
- Versioned object keys (`widget-<semver>.js`) are optional; MVP ships a mutable `widget.js` with short `Cache-Control` (`max-age=300`) so deploys propagate without a separate purge step.
