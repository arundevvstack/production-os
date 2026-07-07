$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Native Windows AI Gateway Startup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path "$ScriptDir\docker\ai-gateway"

if (-not (Test-Path ".venv")) {
    Write-Host "Creating Python Virtual Environment..." -ForegroundColor Yellow
    python -m venv .venv
}

Write-Host "Activating Virtual Environment..." -ForegroundColor Yellow
. .venv\Scripts\Activate.ps1

Write-Host "Installing Dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "Verifying CUDA Availability..." -ForegroundColor Yellow
$cudaCheck = python -c "import torch; print(torch.cuda.is_available())"
if ($cudaCheck -eq "False") {
    Write-Host "ERROR: CUDA is not available. Please install PyTorch with CUDA support and ensure your GPU drivers are up to date." -ForegroundColor Red
    exit 1
}

Write-Host "CUDA Detected. Starting FastAPI Gateway..." -ForegroundColor Green
uvicorn main:app --host 0.0.0.0 --port 8000
