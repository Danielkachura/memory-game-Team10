@echo off
REM Squad RPS - Team 10 - One-shot launcher (Windows)
REM Starts FastAPI backend (port 8000) + Vite dev server (port 5173) and opens the browser.

setlocal
cd /d "%~dp0"

echo [1/3] Starting Python backend on http://127.0.0.1:8000 ...
start "Squad RPS Backend" cmd /k "python -m uvicorn backend.python_api.app:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Starting Vite dev server on http://localhost:5173 ...
start "Squad RPS Frontend" cmd /k "npm --prefix frontend\app run dev -- --host 0.0.0.0"

echo [3/3] Waiting for servers, then opening the browser ...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo Squad RPS is launching. Two console windows have opened (backend + frontend).
echo To play across the LAN, share http://YOUR-LAN-IP:5173 with the other player.
echo Close the consoles to stop the servers.
endlocal
