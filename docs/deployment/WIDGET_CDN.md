# Widget CDN — Google Cloud Storage

Host the embeddable bundle `apps/widget/dist/widget.js` on GCS so customer sites load Genie via a public script URL.

**ADR:** [0006-widget-cdn-gcs.md](../adr/0006-widget-cdn-gcs.md) (supersedes Cloudflare R2 ADR 0005)

## Production URL pattern

| Environment | `NEXT_PUBLIC_WIDGET_SCRIPT_URL` |
|-------------|-------------------------------|
| Local / unset | `https://cdn.example.com/widget.js` (placeholder) |
| Bootstrap (GCS) | `https://storage.googleapis.com/<bucket>/widget.js` |
| Production (custom domain + CDN) | `https://cdn.<your-domain>/widget.js` |

After publishing, set the same value in:

1. Vercel → Project **chatbotmaker** → Environment Variables → `NEXT_PUBLIC_WIDGET_SCRIPT_URL`
2. Local `apps/web/.env.local` for dashboard snippet parity
3. Optional: `.env.widget-cdn.local` → `WIDGET_CDN_PUBLIC_URL`

## One-time GCP setup

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`) — on Windows, WSL scripts under `scripts/install-gcloud-wsl*.sh` may help.
2. `gcloud auth login` and pick your project: `gcloud config set project <PROJECT_ID>`
3. Dedicated bucket (suggested name: `genie-widget`). Deploy scripts can create it if missing.
4. Public read is granted by the deploy script (`allUsers` → `roles/storage.objectViewer` on the **bucket**). Use a **dedicated** bucket — do not store private data there.
5. Optional later: Cloud CDN + HTTPS load balancer + custom domain `cdn.<your-domain>`.

### Required env vars / GitHub secrets

| Name | Where | Purpose |
|------|--------|---------|
| `GCP_PROJECT_ID` | shell / GitHub `vars` | Project for `gcloud` |
| `GCS_WIDGET_BUCKET` | shell / `vars` | Bucket name (default `genie-widget`) |
| `GCS_WIDGET_OBJECT_KEY` | shell / `vars` | Object key (default `widget.js`) |
| `WIDGET_CDN_PUBLIC_URL` | shell / `vars` | Full public URL for verify + docs |
| `ENABLE_WIDGET_CDN_DEPLOY` | GitHub `vars` | Must be `true` to run GCS publish job |
| `GCP_SA_KEY` | GitHub `secrets` | Service account JSON for CI upload |

Local file (gitignored): `.env.widget-cdn.local` — load with `.\scripts\load-widget-cdn-env.ps1`.

## Manual deploy

```bash
# from repo root (bash / WSL / Git Bash)
export GCP_PROJECT_ID=your-gcp-project
export GCS_WIDGET_BUCKET=genie-widget
export WIDGET_CDN_PUBLIC_URL=https://storage.googleapis.com/genie-widget/widget.js

./scripts/deploy-widget-cdn.sh
```

PowerShell:

```powershell
. .\scripts\load-widget-cdn-env.ps1
.\scripts\deploy-widget-cdn.ps1
```

Dry-run (build + validate, no upload):

```bash
./scripts/deploy-widget-cdn.sh --dry-run
```

```powershell
.\scripts\deploy-widget-cdn.ps1 -DryRun
```

## CI

Workflow: `.github/workflows/deploy-widget-cdn.yml`

| Job | When |
|-----|------|
| `build-artifact` | Push to `main` touching widget paths, or `workflow_dispatch` |
| `publish-gcs` | Same triggers **and** `vars.ENABLE_WIDGET_CDN_DEPLOY == 'true'` **and** `GCP_SA_KEY` + `GCP_PROJECT_ID` |

## Cache headers

Deploy scripts set:

```text
Content-Type: application/javascript; charset=utf-8
Cache-Control: public, max-age=300, stale-while-revalidate=86400
```

## Verify

```bash
pnpm --filter @genie/widget build
curl -sI "$WIDGET_CDN_PUBLIC_URL"   # expect 200 + application/javascript
```

## Rollback

Re-upload a known-good `widget.js` with the same object key, or point `NEXT_PUBLIC_WIDGET_SCRIPT_URL` at a previous versioned object if you published one.
