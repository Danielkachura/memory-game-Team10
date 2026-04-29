# Project Map

## Read Order

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/PRD.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DECISIONS.md` when a change affects an architectural choice

## Main Paths

- `frontend/app/`: Vite app entrypoint, tests, configs, styles
- `frontend/modules/shared/`: canonical game types, constants, score calculation
- `frontend/modules/game/`: gameplay hook, board, setup, hint panel, win screen
- `frontend/modules/ai/`: prompt builders and browser-to-proxy AI services
- `backend/modules/claude_proxy/`: validators, Claude service, proxy API handler
- `tests/e2e/`: Playwright coverage
- `docs/`: PRD, architecture, decisions, sprint artifacts, UI kit

## Practical Conventions

- Keep business rules in shared or game modules, not in presentational components.
- Frontend work usually touches both `frontend/app/src/` and one or more module packages.
- Backend proxy changes should include input validation and fallback-aware behavior.
- E2E flows assume the dev server runs on port `5173`.

## Common Task Routing

### Gameplay bug

Read:
- `frontend/modules/game/src/hooks/useGame.ts`
- `frontend/modules/game/src/components/`
- `frontend/modules/shared/src/`

Verify:
- `npm --prefix frontend/app run test`

### Shared rules change

Read:
- `frontend/modules/shared/src/constants/`
- `frontend/modules/shared/src/types/`
- `frontend/app/src/sharedRules.test.ts`

Verify:
- `npm --prefix frontend/app run test`

### Claude feature or proxy change

Read:
- `frontend/modules/ai/src/`
- `backend/modules/claude_proxy/src/`
- `docs/ARCHITECTURE.md`

Verify:
- `npm --prefix frontend/app run test`
- targeted extra checks if backend runtime wiring changes

### UI flow change

Read:
- `frontend/app/src/App.tsx`
- `frontend/modules/game/src/components/`
- `tests/e2e/example.spec.ts`

Verify:
- `npm --prefix frontend/app run test`
- `npx playwright test`

