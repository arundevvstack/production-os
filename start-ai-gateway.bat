@echo off
setlocal

echo =========================================
echo Native Windows AI Gateway Startup
echo =========================================

cd /d "%~dp0docker\ai-gateway"

if not exist ".venv" (
    echo Creating Python Virtual Environment...
    python -m venv .venv
)

echo Activating Virtual Environment...
call .venv\Scripts\activate

echo Installing Dependencies...
pip install -r requirements.txt

echo Verifying CUDA Availability...
python -c "import sys; import torch; sys.exit(0 if torch.cuda.is_available() else 1)"
if errorlevel 1 (
    echo ERROR: CUDA is not available. Please install PyTorch with CUDA support and ensure your GPU drivers are up to date.
    exit /b 1
)

echo CUDA Detected. Starting FastAPI Gateway...
uvicorn main:app --host 0.0.0.0 --port 8000

endlocal
