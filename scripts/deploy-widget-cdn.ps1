# Build apps/widget and publish dist/widget.js to Cloudflare R2.
# Docs: docs/deployment/WIDGET_CDN.md
#
# Required env (unless -DryRun without upload):
#   CLOUDFLARE_API_TOKEN
#   CLOUDFLARE_ACCOUNT_ID
# Optional:
#   CLOUDFLARE_R2_BUCKET      (default: genie-widget)
#   CLOUDFLARE_R2_OBJECT_KEY  (default: widget.js)
#   WIDGET_CDN_PUBLIC_URL
#   SKIP_BUILD=1

[CmdletBinding()]
param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

$Bucket = if ($env:CLOUDFLARE_R2_BUCKET) { $env:CLOUDFLARE_R2_BUCKET } else { "genie-widget" }
$ObjectKey = if ($env:CLOUDFLARE_R2_OBJECT_KEY) { $env:CLOUDFLARE_R2_OBJECT_KEY } else { "widget.js" }
$Bundle = Join-Path $RepoRoot "apps/widget/dist/widget.js"
$PublicUrl = $env:WIDGET_CDN_PUBLIC_URL
$WranglerConfig = Join-Path $RepoRoot "apps/widget/wrangler.toml"

Write-Host "==> Genie widget CDN deploy (Cloudflare R2)"
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
if (-not $env:CLOUDFLARE_API_TOKEN) { $missing += "CLOUDFLARE_API_TOKEN" }
if (-not $env:CLOUDFLARE_ACCOUNT_ID) { $missing += "CLOUDFLARE_ACCOUNT_ID" }

if ($missing.Count -gt 0) {
  if ($DryRun) {
    Write-Host "==> Dry-run: would require env: $($missing -join ', ')"
    Write-Host "==> Dry-run OK (build + path checks only)"
    exit 0
  }
  Write-Error "missing required env: $($missing -join ', '). See docs/deployment/WIDGET_CDN.md"
}

if ($DryRun) {
  Write-Host "==> Dry-run: would upload to r2://$Bucket/$ObjectKey"
  Write-Host "==> Dry-run OK"
  exit 0
}

Write-Host "==> Uploading to R2 via pinned wrangler (apps/widget)"
pnpm --filter @genie/widget exec wrangler r2 object put "$Bucket/$ObjectKey" `
  --file="$Bundle" `
  --content-type="application/javascript; charset=utf-8" `
  --cache-control="public, max-age=300, stale-while-revalidate=86400" `
  --config="$WranglerConfig" `
  --remote
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "==> Published r2://${Bucket}/${ObjectKey}"
if ($PublicUrl) {
  Write-Host "==> Public URL: $PublicUrl"
  Write-Host "    Set Vercel NEXT_PUBLIC_WIDGET_SCRIPT_URL to this value."
  Write-Host "==> Verifying public URL"
  Invoke-WebRequest -Method Head -Uri $PublicUrl -UseBasicParsing | Out-Null
  Write-Host "==> Public URL reachable"
} else {
  Write-Host "==> Set WIDGET_CDN_PUBLIC_URL next time to print/verify the public URL."
  Write-Host "    Pattern: https://cdn.<your-domain>/widget.js"
}
