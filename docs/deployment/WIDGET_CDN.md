# Widget CDN — Cloudflare R2

Host the embeddable bundle `apps/widget/dist/widget.js` on Cloudflare so customer sites load Genie via a public script URL.

**ADR:** [0005-widget-cdn-cloudflare-r2.md](../adr/0005-widget-cdn-cloudflare-r2.md)

## Production URL pattern

| Environment | `NEXT_PUBLIC_WIDGET_SCRIPT_URL` |
|-------------|-------------------------------|
| Local / unset | `https://cdn.example.com/widget.js` (placeholder) |
| Production | `https://cdn.<your-domain>/widget.js` |

Examples once DNS is wired:

```text
https://cdn.chatbotmaker.dev/widget.js
https://cdn.genie.app/widget.js
```

Bootstrap (before custom domain): R2 public development URL from the Cloudflare dashboard, e.g. `https://pub-<hash>.r2.dev/widget.js` — replace with the custom domain before marketing embeds.

After publishing, set the same value in:

1. Vercel → Project **chatbotmaker** → Environment Variables → `NEXT_PUBLIC_WIDGET_SCRIPT_URL`
2. Local `apps/web/.env.local` for dashboard snippet parity

## One-time Cloudflare setup

1. Create a **dedicated** R2 bucket used only for the widget (suggested name: `genie-widget`). Do not store other data in this bucket.
2. Enable public access:
   - Prefer **Custom domain** → `cdn.<your-domain>` (Cloudflare DNS zone required), or
   - Temporary **R2.dev** subdomain for smoke tests only — replace before customer embeds.
3. Create an API token with least privilege: **Account → Workers R2 Storage → Edit**, scoped to this account/bucket where Cloudflare UI allows. Rotate if leaked.
4. Note Account ID (Workers & Pages overview).

### Required env vars / GitHub secrets

| Name | Where | Purpose |
|------|--------|---------|
| `CLOUDFLARE_API_TOKEN` | shell / `secrets` | Wrangler auth |
| `CLOUDFLARE_ACCOUNT_ID` | shell / `secrets` | Account scope |
| `CLOUDFLARE_R2_BUCKET` | shell / `vars` or `secrets` | Bucket name (default `genie-widget`) |
| `WIDGET_CDN_PUBLIC_URL` | shell / `vars` | Full public URL printed after upload (e.g. `https://cdn.example.com/widget.js`) |
| `ENABLE_WIDGET_CDN_DEPLOY` | GitHub `vars` | Must be `true` to run R2 publish job |

Optional object key override: `CLOUDFLARE_R2_OBJECT_KEY` (default `widget.js`).

## Manual deploy

```bash
# from repo root (bash / WSL / Git Bash)
export CLOUDFLARE_API_TOKEN=…
export CLOUDFLARE_ACCOUNT_ID=…
export CLOUDFLARE_R2_BUCKET=genie-widget
export WIDGET_CDN_PUBLIC_URL=https://cdn.<your-domain>/widget.js

./scripts/deploy-widget-cdn.sh
```

PowerShell:

```powershell
$env:CLOUDFLARE_API_TOKEN = "…"
$env:CLOUDFLARE_ACCOUNT_ID = "…"
$env:CLOUDFLARE_R2_BUCKET = "genie-widget"
$env:WIDGET_CDN_PUBLIC_URL = "https://cdn.<your-domain>/widget.js"

.\scripts\deploy-widget-cdn.ps1
```

Dry-run (build + validate env, no upload):

```bash
./scripts/deploy-widget-cdn.sh --dry-run
```

## CI

Workflow: `.github/workflows/deploy-widget-cdn.yml`

| Job | When |
|-----|------|
| `build-artifact` | Push to `main` touching widget paths, or `workflow_dispatch` — always builds and uploads `widget.js` as a GitHub Actions artifact |
| `publish-r2` | Same triggers **and** `vars.ENABLE_WIDGET_CDN_DEPLOY == 'true'` **and** Cloudflare secrets present |

## Cache headers

Deploy scripts set:

```text
Content-Type: application/javascript; charset=utf-8
Cache-Control: public, max-age=300, stale-while-revalidate=86400
```

Short `max-age` keeps MVP deploys simple without mandatory cache purge. Tighten (longer TTL + versioned filenames) in Phase 10 if needed.

## Verify

```bash
pnpm --filter @genie/widget build
curl -sI "$WIDGET_CDN_PUBLIC_URL"   # expect 200 + application/javascript
# Dashboard Deploy tab snippet src= should match NEXT_PUBLIC_WIDGET_SCRIPT_URL
```

## Rollback

Re-upload a known-good `widget.js` with the same object key, or point `NEXT_PUBLIC_WIDGET_SCRIPT_URL` at a previous versioned object if you published one.
