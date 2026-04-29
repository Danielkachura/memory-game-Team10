#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "[1/3] Starting Python backend on http://0.0.0.0:8000 ..."
python -m uvicorn backend.python_api.app:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[2/3] Starting Vite dev server on http://0.0.0.0:5173 ..."
npm --prefix frontend/app run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

cleanup() { kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

sleep 4
( command -v xdg-open >/dev/null && xdg-open http://localhost:5173 ) \
  || ( command -v open >/dev/null && open http://localhost:5173 ) || true
echo "[3/3] To play across the LAN, share http://YOUR-LAN-IP:5173"
wait
