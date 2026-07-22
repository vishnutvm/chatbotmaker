# Build apps/widget and publish dist/widget.js to Google Cloud Storage.
# Docs: docs/deployment/WIDGET_CDN.md
#
# Required env (unless -DryRun without upload):
#   GCP_PROJECT_ID
# Optional:
#   GCS_WIDGET_BUCKET / GCS_WIDGET_OBJECT_KEY / GCS_WIDGET_LOCATION
#   WIDGET_CDN_PUBLIC_URL / SKIP_BUILD / SKIP_BUCKET_CREATE

[CmdletBinding()]
param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

$Bucket = if ($env:GCS_WIDGET_BUCKET) { $env:GCS_WIDGET_BUCKET } else { "genie-widget" }
$ObjectKey = if ($env:GCS_WIDGET_OBJECT_KEY) { $env:GCS_WIDGET_OBJECT_KEY } else { "widget.js" }
$Location = if ($env:GCS_WIDGET_LOCATION) { $env:GCS_WIDGET_LOCATION } else { "asia-south1" }
$Bundle = Join-Path $RepoRoot "apps/widget/dist/widget.js"
$PublicUrl = $env:WIDGET_CDN_PUBLIC_URL
$GsUri = "gs://${Bucket}/${ObjectKey}"

Write-Host "==> Genie widget CDN deploy (Google Cloud Storage)"
Write-Host "    project: $($env:GCP_PROJECT_ID)"
Write-Host "    bucket:  $Bucket"
Write-Host "    object:  $ObjectKey"
Write-Host "    dry-run: $DryRun"
Write-Host ""

if ($env:SKIP_BUILD -ne "1") {
  Write-Host "==> Building @genie/widget"
  pnpm --filter @genie/widget build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "==> SKIP_BUILD=1 — using existing bundle"
}

if (-not (Test-Path $Bundle)) {
  Write-Error "missing $Bundle — run build first"
}

$Bytes = (Get-Item $Bundle).Length
Write-Host "==> Bundle: $Bundle ($Bytes bytes)"

$missing = @()
if (-not $env:GCP_PROJECT_ID) { $missing += "GCP_PROJECT_ID" }
$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloud) {
  if ($DryRun) {
    Write-Host "==> Dry-run: gcloud not on PATH (install or use WSL)"
  } else {
    $missing += "gcloud(CLI)"
  }
}

if ($missing.Count -gt 0) {
  if ($DryRun) {
    Write-Host "==> Dry-run: would require: $($missing -join ', ')"
    Write-Host "==> Dry-run OK (build + path checks only)"
    exit 0
  }
  Write-Error "missing required: $($missing -join ', '). See docs/deployment/WIDGET_CDN.md"
}

if ($DryRun) {
  Write-Host "==> Dry-run: would upload to $GsUri"
  Write-Host "==> Dry-run OK"
  exit 0
}

Write-Host "==> Using GCP project $($env:GCP_PROJECT_ID)"
gcloud config set project $env:GCP_PROJECT_ID | Out-Null

if ($env:SKIP_BUCKET_CREATE -ne "1") {
  $desc = & gcloud storage buckets describe "gs://$Bucket" 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "==> Creating bucket gs://$Bucket ($Location)"
    gcloud storage buckets create "gs://$Bucket" `
      --project="$($env:GCP_PROJECT_ID)" `
      --location="$Location" `
      --uniform-bucket-level-access
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
}

Write-Host "==> Uploading $GsUri"
gcloud storage cp $Bundle $GsUri `
  --cache-control="public, max-age=300, stale-while-revalidate=86400" `
  --content-type="application/javascript; charset=utf-8"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Granting public object read (allUsers:objectViewer on bucket)"
gcloud storage buckets add-iam-policy-binding "gs://$Bucket" `
  --member=allUsers `
  --role=roles/storage.objectViewer | Out-Null
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$DefaultPublic = "https://storage.googleapis.com/${Bucket}/${ObjectKey}"
Write-Host ""
Write-Host "==> Published $GsUri"
Write-Host "==> Default public URL: $DefaultPublic"
if ($PublicUrl) {
  Write-Host "==> Configured WIDGET_CDN_PUBLIC_URL: $PublicUrl"
  Write-Host "    Set Vercel NEXT_PUBLIC_WIDGET_SCRIPT_URL to this value."
} else {
  Write-Host "==> Set WIDGET_CDN_PUBLIC_URL=$DefaultPublic (and Vercel NEXT_PUBLIC_WIDGET_SCRIPT_URL)."
}
