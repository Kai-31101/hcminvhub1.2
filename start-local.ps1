$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

if (-not (Test-Path (Join-Path $projectRoot 'node_modules'))) {
  Write-Host 'Installing dependencies...'
  & npm install
  if ($LASTEXITCODE -ne 0) {
    throw 'npm install failed.'
  }
}

Write-Host 'Starting UI at http://127.0.0.1:4173'
& npm run dev -- --host 127.0.0.1 --port 4173
