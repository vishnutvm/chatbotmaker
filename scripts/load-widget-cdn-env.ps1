# Loads .env.widget-cdn.local into the current PowerShell session.
# Usage (from repo root):  . .\scripts\load-widget-cdn-env.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$EnvFile = Join-Path $RepoRoot ".env.widget-cdn.local"

if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing $EnvFile — create it from docs/deployment/WIDGET_CDN.md"
}

Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $idx = $line.IndexOf("=")
  if ($idx -lt 1) { return }
  $name = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1).Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  Set-Item -Path "Env:$name" -Value $value
}

Write-Host "Loaded widget CDN env from .env.widget-cdn.local"
Write-Host "  GCP_PROJECT_ID set: $([bool]$env:GCP_PROJECT_ID)"
Write-Host "  GCS_BUCKET:         $($env:GCS_WIDGET_BUCKET)"
Write-Host "  PUBLIC_URL set:     $([bool]$env:WIDGET_CDN_PUBLIC_URL)"
$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
Write-Host "  gcloud on PATH:     $([bool]$gcloud)"
