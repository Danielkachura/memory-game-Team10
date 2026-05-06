# Deployment Plan

## Recommended Layout

- Frontend: Vercel
- Backend: Railway

This is the preferred setup because the frontend is a static Vite app, while the backend keeps match state in memory and needs a long-running Python process.

## Decision Summary

- Keep the game backend on Railway.
- Keep the browser app on Vercel.
- Use `VITE_BACKEND_URL` to point the frontend at the Railway API.
- Do not try to force the current backend into Vercel serverless without redesigning state storage.

## Vercel Frontend

- Root directory: `frontend/app`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_BACKEND_URL=https://your-railway-backend.up.railway.app`

Notes:

- `frontend/app/vercel.json` keeps SPA routing working.
- The frontend calls the backend directly when `VITE_BACKEND_URL` is set.
- Leave `VITE_BACKEND_URL` unset in local development to use the Vite proxy.

Checklist:

1. Create a Vercel project from the repository.
2. Set the root directory to `frontend/app`.
3. Set build command to `npm run build`.
4. Set output directory to `dist`.
5. Add `VITE_BACKEND_URL` to the Vercel environment variables.
6. Confirm preview deployments can reach the Railway API.

## Railway Backend

- Root directory: `backend/python_api`
- Start command: `uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}`
- Health check: `GET /health`

Notes:

- The backend Dockerfile already exists at `backend/python_api/Dockerfile`.
- The service must remain stateful unless the game logic is redesigned around external persistence.

Checklist:

1. Create a Railway service for `backend/python_api`.
2. Use the existing Dockerfile or a Python service pointing at `uvicorn app:app`.
3. Confirm `/health` returns `200`.
4. Set the Railway public URL as `VITE_BACKEND_URL` in Vercel.
5. Verify match creation and turn progression across the deployed frontend.

Alternative root-repo setup:

- If Railway is pointed at the repository root, it should detect [`requirements.txt`](C:/Projects/Sar/StandAlone/RPS-Squad/requirements.txt) and use [`start.sh`](C:/Projects/Sar/StandAlone/RPS-Squad/start.sh) to boot the backend service.
- Keep the Railway service root at the repo root only if the platform is configured to honor the script entrypoint and Python dependency install.
- If auto-detection still fails, set the Railway service root to `backend/python_api` explicitly.

## CTO Ownership

- The CTO owns deployment architecture decisions.
- DEV and QA should implement and validate only the CTO-approved hosting shape.
- If a future rewrite removes in-memory state, a Vercel-only backend can be reconsidered.
