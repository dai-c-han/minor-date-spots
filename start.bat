@echo off
start "Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\python -m uvicorn main:app --reload --port 8000"
timeout /t 2 > nul
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
