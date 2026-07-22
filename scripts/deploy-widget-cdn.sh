#!/usr/bin/env bash
# Build apps/widget and publish dist/widget.js to Cloudflare R2.
# Docs: docs/deployment/WIDGET_CDN.md
#
# Required env (unless --dry-run without upload):
#   CLOUDFLARE_API_TOKEN
#   CLOUDFLARE_ACCOUNT_ID
# Optional:
#   CLOUDFLARE_R2_BUCKET      (default: genie-widget)
#   CLOUDFLARE_R2_OBJECT_KEY  (default: widget.js)
#   WIDGET_CDN_PUBLIC_URL     (printed after success; curled when set)
#   SKIP_BUILD=1              (reuse existing dist/widget.js)

set -euo pipefail

DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help)
      echo "Usage: $0 [--dry-run]"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

BUCKET="${CLOUDFLARE_R2_BUCKET:-genie-widget}"
OBJECT_KEY="${CLOUDFLARE_R2_OBJECT_KEY:-widget.js}"
BUNDLE="$REPO_ROOT/apps/widget/dist/widget.js"
PUBLIC_URL="${WIDGET_CDN_PUBLIC_URL:-}"
WRANGLER_CONFIG="$REPO_ROOT/apps/widget/wrangler.toml"

echo "==> Genie widget CDN deploy (Cloudflare R2)"
echo "    bucket:  $BUCKET"
echo "    object:  $OBJECT_KEY"
echo "    dry-run: $DRY_RUN"
echo

if [[ "${SKIP_BUILD:-0}" != "1" ]]; then
  echo "==> Building @genie/widget"
  pnpm --filter @genie/widget build
else
  echo "==> SKIP_BUILD=1 — using existing bundle"
fi

if [[ ! -f "$BUNDLE" ]]; then
  echo "ERROR: missing $BUNDLE — run build first" >&2
  exit 1
fi

BYTES="$(wc -c < "$BUNDLE" | tr -d ' ')"
echo "==> Bundle: $BUNDLE ($BYTES bytes)"

missing=()
[[ -z "${CLOUDFLARE_API_TOKEN:-}" ]] && missing+=("CLOUDFLARE_API_TOKEN")
[[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]] && missing+=("CLOUDFLARE_ACCOUNT_ID")

if [[ ${#missing[@]} -gt 0 ]]; then
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "==> Dry-run: would require env: ${missing[*]}"
    echo "==> Dry-run OK (build + path checks only)"
    exit 0
  fi
  echo "ERROR: missing required env: ${missing[*]}" >&2
  echo "See docs/deployment/WIDGET_CDN.md" >&2
  exit 1
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "==> Dry-run: would upload to r2://$BUCKET/$OBJECT_KEY"
  echo "==> Dry-run OK"
  exit 0
fi

echo "==> Uploading to R2 via pinned wrangler (apps/widget)"
pnpm --filter @genie/widget exec wrangler r2 object put "${BUCKET}/${OBJECT_KEY}" \
  --file="$BUNDLE" \
  --content-type="application/javascript; charset=utf-8" \
  --cache-control="public, max-age=300, stale-while-revalidate=86400" \
  --config="$WRANGLER_CONFIG" \
  --remote

echo
echo "==> Published r2://${BUCKET}/${OBJECT_KEY}"
if [[ -n "$PUBLIC_URL" ]]; then
  echo "==> Public URL: $PUBLIC_URL"
  echo "    Set Vercel NEXT_PUBLIC_WIDGET_SCRIPT_URL to this value."
  if command -v curl >/dev/null 2>&1; then
    echo "==> Verifying public URL"
    curl -sfI "$PUBLIC_URL" >/dev/null
    echo "==> Public URL reachable (HTTP 2xx)"
  fi
else
  echo "==> Set WIDGET_CDN_PUBLIC_URL next time to print/verify the public URL."
  echo "    Pattern: https://cdn.<your-domain>/widget.js"
fi
