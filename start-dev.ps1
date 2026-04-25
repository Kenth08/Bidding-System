$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $root "frontend"
$backendPath = Join-Path $root "backend"
$pythonPath = Join-Path $root ".venv\Scripts\python.exe"

if (-not (Test-Path $frontendPath)) {
  throw "frontend folder not found at: $frontendPath"
}

if (-not (Test-Path $backendPath)) {
  throw "backend folder not found at: $backendPath"
}

if (-not (Test-Path $pythonPath)) {
  throw ".venv python not found at: $pythonPath"
}

Write-Host "Starting frontend in a new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$frontendPath'; npm run dev"
)

Write-Host "Starting backend in a new terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$backendPath'; & '$pythonPath' manage.py migrate; & '$pythonPath' manage.py runserver"
)

Write-Host "Done. Frontend and backend terminals were launched." -ForegroundColor Green
