# Sprint 01 - Dev Report
# Squad RPS - Team 10

| Field | Value |
|---|---|
| Sprint | 01 |
| Status | Implemented with failing frontend tests |
| Report date | 2026-05-04 |
| QA sign-off | Not ready |

---

## Goal

Deliver a playable Squad RPS MVP with frontend gameplay, backend authoritative match logic, AI-ready service boundaries, and automated verification.

## What Was Built

### Frontend app shell
- `frontend/app/src/App.tsx`
- `frontend/app/src/main.tsx`
- `frontend/app/src/styles.css`
- `frontend/app/vite.config.ts`
- `frontend/app/package.json`

### Gameplay components
- `frontend/modules/game/src/components/GameScreen.tsx`
- `frontend/modules/game/src/components/GameBoard.tsx`
- `frontend/modules/game/src/components/DuelOverlay.tsx`
- `frontend/modules/game/src/components/GameOverScreen.tsx`
- `frontend/modules/game/src/components/HomeScreen.tsx`
- `frontend/modules/game/src/components/LobbyScreen.tsx`
- `frontend/modules/game/src/components/StartScreen.tsx`
- `frontend/modules/game/src/components/SettingsPanel.tsx`
- `frontend/modules/game/src/components/Sidebar.tsx`
- `frontend/modules/game/src/components/ScorePanel.tsx`
- `frontend/modules/game/src/components/RefereePanel.tsx`
- `frontend/modules/game/src/components/PlayerNameLabel.tsx`
- `frontend/modules/game/src/components/UnitSprite.tsx`

### Gameplay hooks and utilities
- `frontend/modules/game/src/hooks/useGame.ts`
- `frontend/modules/game/src/hooks/useAudio.ts`
- `frontend/modules/game/src/utils/apiBase.ts`
- `frontend/modules/game/src/utils/audioManager.ts`
- `frontend/modules/game/src/utils/matchCheck.ts`

### Shared contracts and rules
- `frontend/modules/shared/src/types/game.ts`
- `frontend/modules/shared/src/constants/gameConfig.ts`
- `frontend/modules/shared/src/constants/themeContent.ts`
- `frontend/modules/shared/src/utils/scoreCalculator.ts`
- `frontend/modules/shared/src/index.ts`

### AI frontend services and prompts
- `frontend/modules/ai/src/services/claudeClient.ts`
- `frontend/modules/ai/src/services/hintService.ts`
- `frontend/modules/ai/src/services/narratorService.ts`
- `frontend/modules/ai/src/services/themeService.ts`
- `frontend/modules/ai/src/prompts/hintPrompt.ts`
- `frontend/modules/ai/src/prompts/narratorPrompt.ts`
- `frontend/modules/ai/src/prompts/themePrompt.ts`
- `frontend/modules/ai/src/index.ts`

### Backend API
- `backend/python_api/app.py`
- `backend/python_api/schemas.py`
- `backend/python_api/service.py`
- `backend/python_api/config.py`
- `backend/python_api/tests/test_app.py`

### Tests
- `frontend/app/src/App.test.tsx`
- `frontend/app/src/GameScreen.test.tsx`
- `frontend/app/src/SettingsPanel.test.tsx`
- `frontend/app/src/useGame.test.tsx`
- `frontend/app/src/backendProxy.test.ts`
- `frontend/app/src/ai.test.ts`
- `frontend/app/src/sharedRules.test.ts`
- `tests/e2e/example.spec.ts`

---

## Test Results

| Check | Result |
|---|---|
| Frontend unit tests | 15 passed / 7 failed |
| Backend unit tests | 8 passed / 0 failed |
| TypeScript lint | Passed |
| Combined executed tests | 23 passed / 7 failed |
| E2E tests | Not run because frontend unit tests are failing |

Commands executed:
- `npm --prefix frontend/app run test`
- `py -m unittest backend.python_api.tests.test_app`
- `npm --prefix frontend/app run lint`
- `npm --prefix frontend/app run test -- --coverage --reporter=dot`

---

## Coverage

Coverage percentage: N/A.

Reason: `@vitest/coverage-v8` was not configured in `package.json`. It was installed locally with `--no-save` for verification, but the failing frontend suite exited before producing a usable coverage report artifact or table.

---

## Known Issues And Shortcuts

- `frontend/app/src/App.test.tsx` has 6 failing tests. The tests query `Start Match`, while the rendered accessible button name is `Start match`.
- `frontend/app/src/GameScreen.test.tsx` has 1 failing test. The test queries `/Choose Paper/i`, while the rendered repick buttons are named `rock`, `paper`, and `scissors`.
- `CLAUDE.md` still describes the old memory-card game, while `docs/ARCHITECTURE.md` and the current code describe Squad RPS.
- `npm ci` reported moderate dependency vulnerabilities. No audit fix was applied because that can introduce breaking dependency changes.
- E2E verification was skipped until the frontend unit suite is repaired.
