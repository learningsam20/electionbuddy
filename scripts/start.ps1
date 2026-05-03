<#
.SYNOPSIS
Starts the ElectionBuddy backend and frontend servers for local development.

.DESCRIPTION
This script checks for any existing processes running on port 8573 (FastAPI) 
and port 5731 (Vite React). If they are running, it forcefully terminates them. 
It then spawns two new terminal windows to run the backend and frontend separately 
so you can view their live logs.
#>

param (
    [switch]$Demo
)

if ($Demo) {
    $env:LOAD_DEMO_DATA = "1"
    Write-Host "Demo mode enabled: Seeding database with election data..." -ForegroundColor Magenta
} else {
    $env:LOAD_DEMO_DATA = "0"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting ElectionBuddy Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Function to kill processes on a specific port
function Kill-Port {
    param ([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            if ($processId -ne 0 -and $processId -ne 4) {
                # Skip System Idle Process & System
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "Stopping existing process $($process.ProcessName) (PID: $processId) on port $Port..." -ForegroundColor Yellow
                        Stop-Process -Id $processId -Force -ErrorAction Stop
                    }
                }
                catch {
                    Write-Host "Could not kill process on port $Port. You may need Administrator privileges." -ForegroundColor Red
                }
            }
        }
        Start-Sleep -Seconds 1 # Wait for port to free up
    }
}

# 1. Cleanup existing instances
Write-Host "Checking for existing instances..." -ForegroundColor White
Kill-Port -Port 8573
Kill-Port -Port 5731

# Adjust paths to run from scripts/ directory
$ProjectRoot = Join-Path $PSScriptRoot ".."
Set-Location $ProjectRoot

# 2. Start Backend
Write-Host "Starting FastAPI Backend on port 8573..." -ForegroundColor Green
$venvPython = Join-Path $ProjectRoot "backend\Scripts\python.exe"
$sysPython  = (Get-Command python -ErrorAction SilentlyContinue).Source
$pythonExe  = if (Test-Path $venvPython) { $venvPython } else { $sysPython }
# Verify the chosen python has fastapi; if not, use system python
$hasFastapi = & $pythonExe -c "import fastapi" 2>$null; if ($LASTEXITCODE -ne 0) { $pythonExe = $sysPython }
$backendCmd = "Write-Host 'ElectionBuddy Backend Logs' -ForegroundColor Cyan; `$env:LOAD_DEMO_DATA='$env:LOAD_DEMO_DATA'; & '$pythonExe' -m uvicorn backend.main:app --reload --port 8573"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -Command $backendCmd" -WorkingDirectory $ProjectRoot -WindowStyle Normal

# 3. Start Frontend
Write-Host "Starting React Frontend on port 5731..." -ForegroundColor Green
$frontendDir = Join-Path $ProjectRoot "frontend"
# Use cmd.exe to run npm to avoid PowerShell shim module loading issues
Start-Process -FilePath "cmd.exe" -ArgumentList "/c title ElectionBuddy Frontend Logs && npm run dev" -WorkingDirectory $frontendDir -WindowStyle Normal

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Servers are starting up in new windows." -ForegroundColor Green
Write-Host " Backend API: http://localhost:8573"
Write-Host " Frontend UI: http://localhost:5731"
Write-Host "========================================" -ForegroundColor Cyan
