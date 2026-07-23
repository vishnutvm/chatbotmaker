#!/usr/bin/env bash
# Build apps/widget and publish dist/widget.js to Google Cloud Storage.
# Docs: docs/deployment/WIDGET_CDN.md
#
# Required env (unless --dry-run without upload):
#   GCP_PROJECT_ID
# Optional:
#   GCS_WIDGET_BUCKET       (default: genie-widget)
#   GCS_WIDGET_OBJECT_KEY   (default: widget.js)
#   GCS_WIDGET_LOCATION     (default: asia-south1 — used only when creating bucket)
#   WIDGET_CDN_PUBLIC_URL   (printed after success; curled when set)
#   SKIP_BUILD=1            (reuse existing dist/widget.js)
#   SKIP_BUCKET_CREATE=1    (do not create bucket if missing)
#
# Auth: gcloud application-default / user credentials (gcloud auth login)

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

BUCKET="${GCS_WIDGET_BUCKET:-genie-widget}"
OBJECT_KEY="${GCS_WIDGET_OBJECT_KEY:-widget.js}"
LOCATION="${GCS_WIDGET_LOCATION:-asia-south1}"
BUNDLE="$REPO_ROOT/apps/widget/dist/widget.js"
PUBLIC_URL="${WIDGET_CDN_PUBLIC_URL:-}"
GS_URI="gs://${BUCKET}/${OBJECT_KEY}"

echo "==> Genie widget CDN deploy (Google Cloud Storage)"
echo "    project: $GCP_PROJECT_ID"
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
[[ -z "${GCP_PROJECT_ID:-}" ]] && missing+=("GCP_PROJECT_ID")

if ! command -v gcloud >/dev/null 2>&1; then
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "==> Dry-run: gcloud not on PATH (install / use WSL)"
  else
    missing+=("gcloud(CLI)")
  fi
fi

if [[ ${#missing[@]} -gt 0 ]]; then
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "==> Dry-run: would require: ${missing[*]}"
    echo "==> Dry-run OK (build + path checks only)"
    exit 0
  fi
  echo "ERROR: missing required: ${missing[*]}" >&2
  echo "See docs/deployment/WIDGET_CDN.md" >&2
  exit 1
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "==> Dry-run: would upload to $GS_URI"
  echo "==> Dry-run OK"
  exit 0
fi

echo "==> Using GCP project $GCP_PROJECT_ID"
gcloud config set project "$GCP_PROJECT_ID" >/dev/null

if [[ "${SKIP_BUCKET_CREATE:-0}" != "1" ]]; then
  if ! gcloud storage buckets describe "gs://${BUCKET}" >/dev/null 2>&1; then
    echo "==> Creating bucket gs://${BUCKET} ($LOCATION)"
    gcloud storage buckets create "gs://${BUCKET}" \
      --project="$GCP_PROJECT_ID" \
      --location="$LOCATION" \
      --uniform-bucket-level-access
  fi
fi

echo "==> Uploading $GS_URI"
gcloud storage cp "$BUNDLE" "$GS_URI" \
  --cache-control="public, max-age=300, stale-while-revalidate=86400" \
  --content-type="application/javascript; charset=utf-8"

echo "==> Granting public object read (allUsers:objectViewer on bucket)"
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member=allUsers \
  --role=roles/storage.objectViewer \
  >/dev/null

DEFAULT_PUBLIC="https://storage.googleapis.com/${BUCKET}/${OBJECT_KEY}"
echo
echo "==> Published $GS_URI"
echo "==> Default public URL: $DEFAULT_PUBLIC"
if [[ -n "$PUBLIC_URL" ]]; then
  echo "==> Configured WIDGET_CDN_PUBLIC_URL: $PUBLIC_URL"
  echo "    Set Vercel NEXT_PUBLIC_WIDGET_SCRIPT_URL to this value."
  if command -v curl >/dev/null 2>&1; then
    echo "==> Verifying public URL"
    curl -sfI "$PUBLIC_URL" >/dev/null
    echo "==> Public URL reachable (HTTP 2xx)"
  fi
else
  echo "==> Set WIDGET_CDN_PUBLIC_URL=$DEFAULT_PUBLIC (and Vercel NEXT_PUBLIC_WIDGET_SCRIPT_URL)."
fi
