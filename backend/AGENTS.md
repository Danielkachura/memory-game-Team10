# Backend - Domain Rules

These rules apply to everything under `backend/`.

## Scope

Backend code in this project exists to support the Memory Game's secure Claude integration layer through the Python API in `backend/python_api/`.

## Owner Tag

`[DEV:backend]`

## Conventions

1. The active backend service lives in `backend/python_api/`.
2. Route handlers stay thin and delegate logic to services and schemas.
3. Input must be validated before any upstream Claude call.
4. No browser-exposed secrets, ever.
5. Backend tests live under `backend/python_api/tests/`.

## Active Backend Layout

```text
python_api/
  README.md
  app.py
  config.py
  schemas.py
  service.py
  tests/
```

## Rules

- The Python backend must keep a `README.md`.
- Backend service logic must have at least one automated test.
- API endpoints must validate input.
- No hardcoded secrets; use environment variables.
- No direct database logic in route handlers.
