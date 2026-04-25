$ErrorActionPreference = "Stop"

param(
  [switch]$Run
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $root "frontend"
$backendPath = Join-Path $root "backend"
$venvPath = Join-Path $root ".venv"
$pythonPath = Join-Path $venvPath "Scripts\python.exe"

if (-not (Test-Path $frontendPath)) {
  throw "frontend folder not found at: $frontendPath"
}

if (-not (Test-Path $backendPath)) {
  throw "backend folder not found at: $backendPath"
}

function New-VenvIfNeeded {
  if (Test-Path $pythonPath) {
    return
  }

  Write-Host "Creating virtual environment..." -ForegroundColor Cyan

  if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -m venv $venvPath
    return
  }

  if (Get-Command python -ErrorAction SilentlyContinue) {
    & python -m venv $venvPath
    return
  }

  throw "Python launcher not found. Install Python 3.11+ and try again."
}

New-VenvIfNeeded

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
& $pythonPath -m pip install --upgrade pip
& $pythonPath -m pip install -r (Join-Path $backendPath "requirements.txt")

$envFile = Join-Path $backendPath ".env"
$envExample = Join-Path $backendPath ".env.example"
if ((-not (Test-Path $envFile)) -and (Test-Path $envExample)) {
  Copy-Item $envExample $envFile
  Write-Host "Created backend .env from .env.example. Update values if needed." -ForegroundColor Yellow
}

Write-Host "Running backend migrations..." -ForegroundColor Cyan
Push-Location $backendPath
try {
  & $pythonPath manage.py migrate
} finally {
  Pop-Location
}

Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location $frontendPath
try {
  npm install
} finally {
  Pop-Location
}

Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Run '.\\start-dev.bat' to launch both frontend and backend." -ForegroundColor Green

if ($Run) {
  Write-Host "Launching dev servers..." -ForegroundColor Cyan
  & (Join-Path $root "start-dev.ps1")
}
