# ADR 0006 — Widget CDN via Google Cloud Storage

- **Status:** accepted
- **Date:** 2026-07-22
- **Phase:** 7 — Widget
- **Supersedes:** [ADR 0005 — Cloudflare R2](./0005-widget-cdn-cloudflare-r2.md)

## Context

Dashboard embed snippets need a stable public URL for `widget.js` (`NEXT_PUBLIC_WIDGET_SCRIPT_URL`). ADR 0005 chose Cloudflare R2 to match the MVP “DNS/CDN = Cloudflare” blueprint. The platform API is already moving to **GCP Cloud Run**, and the Product Owner directed widget hosting to **GCP** as well so CDN/storage stays under one cloud vendor for ops.

## Options

1. **Cloudflare R2** (ADR 0005) — blueprint-aligned; separate Cloudflare account/secrets.
2. **GCS bucket (public object) + optional Cloud CDN** — same cloud as Cloud Run; URL `https://storage.googleapis.com/<bucket>/widget.js` or custom domain later.
3. **Serve from Cloud Run / Vercel public/** — couples releases; weaker third-party cache story.

## Decision

Host `widget.js` on a **dedicated Google Cloud Storage bucket**, publicly readable:

```text
https://storage.googleapis.com/<bucket>/widget.js
```

Preferred production pattern once a custom domain + Cloud CDN/LB are wired:

```text
https://cdn.<your-domain>/widget.js
```

Upload via `gcloud storage cp` from:

- Manual scripts: `scripts/deploy-widget-cdn.sh` / `.ps1`
- Optional GitHub Actions: `.github/workflows/deploy-widget-cdn.yml` (gated on GCP auth)

Set Vercel `NEXT_PUBLIC_WIDGET_SCRIPT_URL` after the first successful publish.

**Blueprint note:** This is an intentional deviation from “widget on Cloudflare CDN” for operational consolidation with Cloud Run. Cloudflare may still be used for DNS later; object origin is GCS.

## Consequences

- Requires GCP project, `gcloud` auth, and a dedicated bucket (no other app data).
- Removes Wrangler / Cloudflare R2 from the widget deploy path.
- Until GCP auth exists, CI still **builds and uploads a GitHub Actions artifact**; dashboard keeps the placeholder URL.
- MVP uses a mutable `widget.js` with `Cache-Control: public, max-age=300` so deploys propagate without mandatory CDN purge.
