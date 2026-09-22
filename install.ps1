$ErrorActionPreference = 'Stop'

Write-Host 'Installing ROBANK dependencies...' -ForegroundColor Cyan
npm install
npm run install:all

if (!(Test-Path 'frontend\.env.local')) {
  Copy-Item 'frontend\.env.example' 'frontend\.env.local'
}

if (!(Test-Path 'backend\.env')) {
  Copy-Item 'backend\.env.example' 'backend\.env'
}

Write-Host ''
Write-Host 'Done. Run: npm run dev' -ForegroundColor Green
