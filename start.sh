#!/usr/bin/env sh
set -eu

cd backend/python_api
exec uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}"
