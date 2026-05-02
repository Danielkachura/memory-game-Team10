# Nati Features Integration Plan

Owner: `[CTO]`  
Date: 2026-05-02

## Goal

Refactor the playable app around `origin/Nati-Features` presentation while keeping the current integration branch logic that already works:
- PVP lobby and attached match flow
- VS AI flow
- backend-authoritative gameplay
- Vercel and Railway deployment wiring
- current backend fixes and tests

## What Is Already Done In `integration-nati-mainline`

These items should be preserved, not rewritten:
- `frontend/app/src/App.tsx` already routes between home, lobby, PVP match, and VS AI match
- `frontend/modules/game/src/hooks/useGame.ts` already supports both solo and PVP modes, reveal completion, polling, legal move/attack targeting, tie repicks, and backend-driven state
- `backend/python_api/app.py`, `backend/python_api/schemas.py`, and `backend/python_api/tests/test_app.py` already contain the current backend-authoritative match flow
- `vercel.json`, `railway.json`, `nixpacks.toml`, `Procfile`, `run.py`, and `scripts/start.mjs` already hold the deploy/runtime path that must survive
- recent commits already added PVP lobby flow, API base handling, CORS, and Railway loading fixes

## What Was Lost From `origin/Nati-Features`

These files and assets define the visual/audio baseline and should be restored first:
- `frontend/modules/game/src/components/DuelOverlay.tsx`
- `frontend/modules/game/src/components/Sidebar.tsx`
- `frontend/modules/game/src/components/RefereePanel.tsx`
- `frontend/modules/game/src/components/PlayerNameLabel.tsx`
- `frontend/modules/game/src/components/UnitSprite.tsx`
- `frontend/modules/game/src/components/StartScreen.tsx`
- `frontend/modules/game/src/hooks/useAudio.ts`
- `frontend/modules/game/src/utils/audioManager.ts`
- `frontend/app/public/audio/*`
- Nati image assets under `frontend/app/public/*`

## Integration Rule

Do not port Nati's old state ownership back into the app. Only port presentation, assets, and audio behavior. The current branch remains the source for:
- match state shape
- API calls
- PVP/AI branching
- reveal timing and backend progression
- deployment and environment wiring

## Execution Plan

### Phase 1 - Restore presentation primitives

Bring back Nati's visual building blocks and assets without changing backend contracts:
- restore `DuelOverlay`, `Sidebar`, `RefereePanel`, `PlayerNameLabel`, `UnitSprite`, `useAudio`, and `audioManager`
- restore `frontend/app/public/audio/*` and the related character, weapon, referee, and logo assets from Nati
- restore any CSS variables, animations, and sprite-sheet styling required by those components

Acceptance:
- the app compiles with restored assets and no broken imports
- audio files resolve from `frontend/app/public/audio/*`
- duel, referee, and unit components render against current match payloads

### Phase 2 - Re-skin the active match screen around current logic

Replace the current utilitarian `GameScreen` shell with a composition that uses Nati's UI:
- use Nati-style start/setup screen for VS AI
- use Nati-style board presentation and unit rendering
- use Nati `Sidebar` as the persistent match HUD
- use Nati `DuelOverlay` for duel/tie resolution presentation
- use Nati `RefereePanel` and labels where they improve turn readability

Important constraint:
- current `useGame` stays in charge of actions, timers, PVP attach flow, and state transitions

Acceptance:
- a solo match still starts from the current app routing
- a PVP match still opens from the lobby path
- reveal, move, duel, repick, and finish states all render with Nati presentation

### Phase 3 - Reconcile audio flow with current phases

Wire Nati's `useAudio` and `audioManager` to the current match lifecycle:
- reveal start should restart BGM and play shuffle
- turn handoff SFX should only fire when meaningful in the current flow
- duel overlay opening should drive combat audio
- game over should fade out BGM and play win/lose outcome

Required adjustment:
- current branch has `viewer`, `mode`, and PVP polling behavior that Nati's audio code never handled directly, so the hook must be adapted instead of copied blindly

Acceptance:
- no autoplay crashes after first user gesture
- no repeated turn sounds from polling updates
- duel audio matches the visible duel overlay timing

### Phase 4 - Preserve deploy and environment wiring

After the UI restore, verify that the following files remain unchanged in intent:
- `vercel.json`
- `railway.json`
- `nixpacks.toml`
- `Procfile`
- `run.py`
- `scripts/start.mjs`
- `frontend/modules/game/src/utils/apiBase.ts`

Acceptance:
- frontend still reads `import.meta.env.VITE_API_BASE`
- Vercel still points API traffic correctly
- Railway still boots FastAPI correctly

### Phase 5 - Regression verification

Required verification after integration:
- `npm --prefix frontend/app run test`
- targeted backend tests for `backend/python_api/tests/test_app.py`
- browser verification for:
  - home -> VS AI -> match
  - home -> PVP lobby -> attached match
  - reveal -> move -> duel -> repick -> result
  - audio unlock after first gesture
  - deployment env path still working with `VITE_API_BASE`

## Risks And Tradeoffs

- Nati presentation components were built against an older UI shell and may assume different types or prop names
- audio hooks can easily double-fire under the current polling-based PVP flow if not debounced against state transitions
- asset restoration is broad; missing even one sprite or audio file will create runtime regressions that look like logic bugs
- `GameScreen.tsx` is the highest-risk integration file because it now carries both routing expectations and gameplay presentation

## Recommended File Order

Implement in this order to reduce churn:
1. assets in `frontend/app/public/*`
2. `audioManager.ts` and `useAudio.ts`
3. visual leaf components: `UnitSprite`, `PlayerNameLabel`, `RefereePanel`, `DuelOverlay`, `Sidebar`
4. `GameScreen.tsx`
5. tests and regression fixes

## Branch Strategy

Use the current integration branch as the working branch. Do not hard-reset to `origin/Nati-Features`. The correct move is selective restoration of Nati presentation onto the branch that already contains:
- PVP
- VS AI
- backend authority
- Vercel and Railway support
