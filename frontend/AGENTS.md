# Frontend - Domain Rules

These rules apply to everything under `frontend/`.

## Scope

Frontend code owns the playable Squad RPS UI, board interactions, and player-facing Claude features.

## Owner Tag

`[DEV:frontend]`

## Conventions

1. Each frontend feature lives in its own module under `frontend/modules/`.
2. Reusable UI elements live in the module's `src/components/`.
3. Hooks own stateful gameplay behavior.
4. Module tests live in `tests/unit/` and `tests/integration/`.
5. Styling follows `docs/ui/UI_KIT.md`.

## Active Module Layout

```text
modules/<name>/
  README.md
  src/
    components/
    hooks/
    utils/
    index.ts
  tests/
    unit/
    integration/
```

## Rules

- Every component should have at least one relevant test.
- No business logic buried inside presentational components.
- No hardcoded secrets or backend-only config.
- Accessibility is required by default.
- Responsive behavior must be considered on mobile and desktop.
- Reusable styling should come from the design system.
