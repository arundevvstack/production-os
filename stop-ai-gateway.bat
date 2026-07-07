@echo off
echo Stopping FastAPI Gateway...
taskkill /F /IM uvicorn.exe /T
echo AI Gateway Stopped.
