# GBU Initial Scan — Squad RPS
# CTO Review | 2026-04-29

> **[CTO]** Methodology: Vibe Coding 101 (Avi Rabinowitz, AIcademy 2026)
> This is the mandatory GBU before any implementation begins.

---

## ✅ GOOD — What is solid and reusable

### 1. PRD is complete and demo-ready
`docs/PRD.md` is detailed, well-structured, and includes all five user stories with explicit acceptance criteria. Board layout, game phases (Reveal → Role Assignment → Duel Rounds), win conditions, Flag/Decoy mechanics, and AI integration are all clearly specified.

### 2. Tech stack decisions are locked and reasonable
- React + TypeScript + Vite (frontend) ✓
- Python + FastAPI (backend proxy) ✓
- Vitest + Testing Library + Playwright (test suite) ✓
- Claude API for squad generation + AI opponent ✓
- All decisions are documented in `docs/DECISIONS.md`

### 3. Frontend scaffold exists
`frontend/app/` has a Vite + TS + Tailwind setup. `frontend/modules/` has a module boundary structure (shared, game, ai, ui). The scaffold is a usable starting point even though the contents must be rewritten.

### 4. Backend stub exists
`backend/python_api/__init__.py` and `tests/__init__.py` are in place. The directory structure follows the architecture plan.

### 5. Agent squad is now complete
Six synchronized agents (CTO, DEV-RPS, QA-RPS, DOCS-RPS, CONTENT-RPS, ANALYST-RPS) are defined with clear ownership and the Vibe Coding 101 methodology is now embedded in the CTO.

---

## ⚠️ BAD — Issues that require a Fix Iteration before Sprint 1 starts

### B1. CRITICAL — Board size canon conflict
- **PRD says:** `5×6` (5 columns × 6 rows, 30 squares)
- **CLAUDE.md / AGENTS.md / CtoAgent.md say:** `6×6`
- **Impact:** Every agent is operating on a different board. DEV will build a different grid than ARIA will render.
- **Fix required:** Founder must decide the canonical board size. Until decided, this is a **BLOCKER**.

### B2. CRITICAL — Unit type conflict: Decoy ≠ Trap
- **PRD says:** units are `rock / paper / scissors / Flag / Decoy`
- **CLAUDE.md / AGENTS.md / CtoAgent.md say:** units are `rock / paper / scissors / flag / trap`
- **Impact:** QA, ARIA, and DEV are building rules for a `trap` that doesn't exist in the PRD. The Decoy's invulnerability mechanic has no equivalent in the agent canon.
- **Fix required:** Align all agent files to the PRD. `trap` → `decoy`. This is a **BLOCKER**.

### B3. ARCHITECTURE.md describes the wrong game
`docs/ARCHITECTURE.md` still documents the Memory Game:
- Types: `Card`, `GameState.flippedIds`, `matchedPairs`, `Theme`, `Score`
- Flows: "Flip and Match", "Hint Request", "Win Recap"
- Module: `frontend/modules/game/` described as card-flip components
- Backend: Module plan references `cards/` and `hints/`
- **Impact:** Every agent reading ARCHITECTURE.md for guidance will implement the wrong game.
- **Fix required:** `[DOCS-RPS]` must rewrite `ARCHITECTURE.md` for Squad RPS before any code work.

### B4. Sprint 01 TODO is for the wrong game
`docs/sprints/sprint_01/todo/sprint_01_todo.md` contains 19 Memory Game tasks (shuffle, matchCheck, scoreCalculator, MemoryCard, useGame flip/match, hint flow, win recap). **0/19** tasks are relevant to Squad RPS.
- **Fix required:** Entire Sprint 1 backlog must be replaced. See new backlog below.

### B5. Existing frontend code is Memory Game code
Files that must be deleted or fully rewritten:
- `frontend/modules/game/src/components/MemoryCard.tsx`
- `frontend/modules/game/src/utils/buildDeck.ts`
- `frontend/modules/game/src/utils/matchCheck.ts`
- `frontend/modules/game/src/utils/shuffle.ts`
- `frontend/modules/shared/src/types/game.ts` (Card, GameState, Score — wrong types)
- `frontend/modules/shared/src/constants/themeContent.ts`
- `frontend/modules/ai/src/prompts/hintPrompt.ts`
- `frontend/modules/ai/src/prompts/themePrompt.ts`
- `frontend/modules/ai/src/services/hintService.ts`
- `frontend/modules/ai/src/services/themeService.ts`

### B6. Model ID in PRD is outdated
PRD Section 8 references `claude-sonnet-4-20250514`. Current model is `claude-sonnet-4-6`.
- **Fix required:** Update PRD and all prompt builders to use `claude-sonnet-4-6`.

---

## 🔴 UGLY — Technical debt that must be scheduled for cleanup

### U1. Zero test coverage — Quality Gate failing
- Current coverage: **0%**
- Quality Gate requirement: **≥ 80%**
- Existing test files (`ai.test.ts`, `sharedRules.test.ts`, `backendProxy.test.ts`) test Memory Game logic that is being deleted.
- **Schedule:** All test files must be replaced in Sprint 1. No merge to production until coverage ≥ 80%.

### U2. Frontend modules contain Memory Game business logic mixed with scaffold
The `frontend/modules/` tree has correct structural boundaries (shared, game, ai, ui) but the contents are all for the wrong product. The structure is salvageable; the contents are not.

### U3. DECISIONS.md still references Memory Game framing
All six decisions in `docs/DECISIONS.md` are framed for the Memory Game. The Squad RPS pivot decisions (Python/FastAPI backend, AI-opponent strategy, hidden-info enforcement, Decoy stalemate rule, board layout, movement mechanics) are recorded in PRD Section 9–10 but **not yet in DECISIONS.md**.
- **Schedule:** `[DOCS-RPS]` to migrate PRD open questions into DECISIONS.md after B1 and B2 are resolved.

### U4. No backend implementation at all
`backend/python_api/` contains only empty `__init__.py` files. No `app.py`, no routes, no schemas, no service layer. The proxy contract defined in ARCHITECTURE.md is for the Memory Game anyway (see B3).

---

## Fix Iteration Required Before Sprint 1

The following must be resolved by the founder or CTO **before any implementation begins**:

| # | Fix | Owner | Blocker? |
|---|---|---|---|
| F1 | Decide canonical board size: 5×6 (PRD) or 6×6 (agents) | **Founder** | YES |
| F2 | Decide canonical unit names: `decoy` (PRD) or `trap` (agents) | **Founder** | YES |
| F3 | Rewrite `ARCHITECTURE.md` for Squad RPS | `[DOCS-RPS]` | YES |
| F4 | Replace Sprint 1 backlog with Squad RPS tasks | `[CTO]` | YES |
| F5 | Update model ID in PRD from `claude-sonnet-4-20250514` to `claude-sonnet-4-6` | `[DOCS-RPS]` | No |
| F6 | Migrate PRD open questions to `DECISIONS.md` | `[DOCS-RPS]` | No |
