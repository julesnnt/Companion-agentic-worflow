# COMPANION - Demo Launcher (PowerShell)
$ErrorActionPreference = "Stop"

$ROOT     = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND  = Join-Path $ROOT "backend"
$FRONTEND = Join-Path $ROOT "frontend"

function Write-Step($msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "  [ERR] $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "  $msg" -ForegroundColor Gray }

Write-Host ""
Write-Host "  ================================================" -ForegroundColor DarkCyan
Write-Host "   COMPANION  |  Healthcare AI Demo" -ForegroundColor White
Write-Host "  ================================================" -ForegroundColor DarkCyan
Write-Host ""

# Check Python
Write-Step "Checking Python..."
$python = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $v = & $cmd --version 2>&1
        if ($v -match "Python 3") { $python = $cmd; break }
    } catch {}
}
if (-not $python) {
    Write-Err "Python 3 not found. Download from https://python.org"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-OK "Python found ($python)"

# Check Node / npm
Write-Step "Checking Node.js..."

# Refresh PATH from registry so recently-installed Node is found
$machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
$userPath    = [System.Environment]::GetEnvironmentVariable("PATH", "User")
$env:PATH    = "$machinePath;$userPath"

$npm = $null

# 1. Try Get-Command (searches full PATH)
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if ($npmCmd) { $npm = $npmCmd.Source }

# 2. Try common Windows install locations
if (-not $npm) {
    $candidates = @(
        "C:\Program Files\nodejs\npm.cmd",
        "C:\Program Files (x86)\nodejs\npm.cmd",
        "$env:APPDATA\npm\npm.cmd",
        "$env:LOCALAPPDATA\Programs\nodejs\npm.cmd",
        "$env:ProgramFiles\nodejs\npm.cmd"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $npm = $c; break }
    }
}

# 3. Search common NVM paths
if (-not $npm) {
    $nvmPaths = Get-ChildItem "$env:APPDATA\nvm" -Filter "npm.cmd" -Recurse -ErrorAction SilentlyContinue |
                Select-Object -First 1
    if ($nvmPaths) { $npm = $nvmPaths.FullName }
}

if (-not $npm) {
    Write-Info "Node.js non trouve. Tentative d'installation via winget..."
    try {
        winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        # Refresh PATH after install
        $machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
        $userPath    = [System.Environment]::GetEnvironmentVariable("PATH", "User")
        $env:PATH    = "$machinePath;$userPath"
        # Retry
        $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
        if ($npmCmd) { $npm = $npmCmd.Source }
        if (-not $npm -and (Test-Path "C:\Program Files\nodejs\npm.cmd")) {
            $npm = "C:\Program Files\nodejs\npm.cmd"
        }
    } catch {}
}

if (-not $npm) {
    Write-Err "Impossible d'installer Node.js automatiquement."
    Write-Host ""
    Write-Host "  ACTION REQUISE :" -ForegroundColor Yellow
    Write-Host "  1. Va sur https://nodejs.org et telecharge la version LTS" -ForegroundColor Yellow
    Write-Host "  2. Lance l'installateur (.msi)" -ForegroundColor Yellow
    Write-Host "  3. REDEMARRE ton PC" -ForegroundColor Yellow
    Write-Host "  4. Relance start.bat" -ForegroundColor Yellow
    Write-Host ""
    Start-Process "https://nodejs.org/en/download"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-OK "npm found: $npm"

# Create .env if missing
$envFile = Join-Path $BACKEND ".env"
if (-not (Test-Path $envFile)) {
    Write-Step "Creating .env (demo mode - no API key needed)..."
    $envContent = "ANTHROPIC_API_KEY=sk-ant-your-key-here`nDEMO_MODE=true"
    Set-Content -Path $envFile -Value $envContent -Encoding UTF8
    Write-OK ".env created (edit it later to add your real Anthropic key)"
}

# Python venv + deps
$venvPath = Join-Path $BACKEND "venv"
if (-not (Test-Path $venvPath)) {
    Write-Step "[1/3] Creating Python virtual environment (first run - takes ~1 min)..."
    & $python -m venv $venvPath
    $pip = Join-Path $venvPath "Scripts\pip.exe"
    & $pip install -r (Join-Path $BACKEND "requirements.txt") -q
    Write-OK "Backend environment ready"
} else {
    Write-OK "[1/3] Python environment OK"
}

# npm install
$nodeModules = Join-Path $FRONTEND "node_modules"
if (-not (Test-Path $nodeModules)) {
    Write-Step "[2/3] Installing frontend packages (first run - takes ~1 min)..."
    Push-Location $FRONTEND
    & $npm install --silent
    Pop-Location
    Write-OK "Frontend packages ready"
} else {
    Write-OK "[2/3] Frontend packages OK"
}

# Launch servers
Write-Host ""
Write-Step "[3/3] Starting servers..."

$uvicorn = Join-Path $venvPath "Scripts\uvicorn.exe"
$backendCmd = "cd '$BACKEND'; & '$uvicorn' main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

Start-Sleep -Seconds 3

$frontendCmd = "cd '$FRONTEND'; & '$npm' run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal

Start-Sleep -Seconds 4
Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "  ================================================" -ForegroundColor DarkCyan
Write-Host "   Backend  ->  http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend ->  http://localhost:5173" -ForegroundColor White
Write-Host "   API Docs ->  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  ================================================" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Both servers are running in separate windows." -ForegroundColor Gray
Write-Host "  Close those windows (or run stop.bat) to stop." -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to close this launcher"
