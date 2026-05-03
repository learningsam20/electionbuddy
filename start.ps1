<#
.SYNOPSIS
Starts the DemocraPlay backend and frontend servers for local development.

.DESCRIPTION
This script checks for any existing processes running on port 8573 (FastAPI) 
and port 5731 (Vite React). If they are running, it forcefully terminates them. 
It then spawns two new terminal windows to run the backend and frontend separately 
so you can view their live logs.
#>

param(
    [switch]$Demo
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Starting DemocraPlay Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($Demo) {
    Write-Host " [Demo Mode Enabled] Demo data will be loaded." -ForegroundColor Yellow
}

# Function to kill processes on a specific port
function Kill-Port {
    param ([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            if ($processId -ne 0 -and $processId -ne 4) { # Skip System Idle Process & System
                try {
                    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "Stopping existing process $($process.ProcessName) (PID: $processId) on port $Port..." -ForegroundColor Yellow
                        Stop-Process -Id $processId -Force -ErrorAction Stop
                    }
                } catch {
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

# 2. Start Backend
Write-Host "Starting FastAPI Backend on port 8573..." -ForegroundColor Green
$BackendEnvCmd = if ($Demo) { "`$env:LOAD_DEMO_DATA='1';" } else { "" }
# Start uvicorn in a new PowerShell window, activate .venv first, run from root
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -Command `"Write-Host 'DemocraPlay Backend Logs' -ForegroundColor Cyan; $BackendEnvCmd .\backend\.venv\Scripts\Activate.ps1; uvicorn backend.main:app --reload --port 8573`"" -WindowStyle Normal

# 3. Start Frontend
Write-Host "Starting React Frontend on port 5731..." -ForegroundColor Green
# Start vite in a new PowerShell window
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -Command `"Write-Host 'DemocraPlay Frontend Logs' -ForegroundColor Cyan; cd frontend; npm run dev`"" -WindowStyle Normal

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Servers are starting up in new windows." -ForegroundColor Green
Write-Host " Backend API: http://localhost:8573"
Write-Host " Frontend UI: http://localhost:5731"
Write-Host "========================================" -ForegroundColor Cyan
