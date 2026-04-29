# Backend - Domain Rules

These rules apply to everything under `backend/`.

## Scope

Backend code in this project exists to support the Memory Game's secure Claude integration layer.

## Owner Tag

`[DEV:backend]`

## Conventions

1. Each backend feature lives in its own module under `backend/modules/`.
2. Route handlers stay thin and delegate logic to services and validators.
3. Input must be validated before any upstream Claude call.
4. No browser-exposed secrets, ever.
5. Tests live with the module in `tests/unit/` and `tests/integration/`.

## Active Module Layout

```text
modules/<name>/
  README.md
  src/
    api/
    services/
    validators/
  tests/
    unit/
    integration/
```

## Rules

- Every backend module must have a `README.md`.
- Every service function must have at least one unit test.
- API endpoints must validate input.
- No hardcoded secrets; use environment variables.
- No direct database logic in route handlers.
