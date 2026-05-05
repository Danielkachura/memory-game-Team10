# Sprint 02 — dev_todo.md
# Squad RPS — Team 10

**Sprint Goal:** Replace the old Memory Game UI shell with the Squad RPS game board, wire every Phase (Reveal → Role Selection → Tactical Play) to the authoritative backend, and ship a demo-ready VS-AI loop.

**CTO Note — What Sprint 01 code audit exposed:**
- `GameBoard.tsx` is still the old memory card component — it has NOTHING to do with the 5×6 squad grid
- `DuelOverlay.tsx` uses `unitId` for image routing but `DuelSummary` interface is missing `attackerId`/`defenderId` — runtime crash waiting to happen
- `useGame.ts` is solid and correctly backend-wired ✅ — keep it, don't rewrite it
- Backend `app.py` is feature-complete for the core loop ✅
- Phase 2 (player picks Flag + Decoy) is missing entirely — backend auto-assigns randomly, PRD says player chooses
- `frontend/modules/ui/` is empty — no shared UI primitives exist yet

---

## BACKEND TASKS

| # | Task | Complexity | Status | Acceptance Criteria |
|---|------|-----------|--------|---------------------|
| B1 | Role Selection endpoint | M | [ ] | `POST /api/match/{id}/roles/assign` accepts `{ flagId, decoyId }`, validates ownership + liveness + distinctness, transitions to `player_turn`. Pydantic schema in `schemas.py`. pytest written first. |
| B2 | Stalemate detection (lone Decoy becomes killable) | S | [ ] | After each duel, if all remaining enemy pieces are Decoys, set `decoy_stalemate=True` and log it. `resolve_attack` skips invulnerability when flag is set. pytest confirms lone Decoy dies normally. |
| B3 | Tie cap (5 consecutive ties → forced resolution) | S | [ ] | `pending_repick["tie_count"]` increments each tie. At 5, force a random winner via `apply_duel_outcome`. Log the forced resolution. pytest: 5 ties → resolved, no 6th repick. |
| B4 | Hidden-info audit — `visible_piece()` regression test | S | [ ] | pytest asserts: enemy `weapon`/`weaponIcon` are `null` outside reveal+duel, enemy `role`/`roleIcon` are `null` until death, `silhouette=True` on hidden enemy pieces. Must catch future regressions. |

**B1 depends on nothing. B2, B3, B4 can run in parallel with B1.**

---

## FRONTEND TASKS

| # | Task | Complexity | Status | Acceptance Criteria |
|---|------|-----------|--------|---------------------|
| F1 | Replace `GameBoard.tsx` with `SquadBoard.tsx` (5×6 grid) | XL | [ ] | New `SquadBoard.tsx` renders 6 rows × 5 cols. Row 6 at top (AI back). Row 1 at bottom (player back). Legal move targets highlighted blue. Legal attack targets highlighted red. Reveal phase: all weapons visible. Post-reveal: own weapons shown, enemy silhouettes. No `any`. Vitest test added. |
| F2 | `UnitToken` component (character on board) | M | [ ] | `UnitToken.tsx` shows correct sprite for owner (blue/red), overlays weapon icon when visible, overlays role icon (🚩/🎭) for own pieces, pulses when selected. No `any`. |
| F3 | `RoleSelectScreen` component (Phase 2) | M | [ ] | Screen shown after reveal timer. Player clicks piece → Flag, another → Decoy. Confirm button calls `POST /api/match/{id}/roles/assign` (B1). Confirm disabled until both selected. 15s auto-assign fallback runs if no submission. Vitest test added. |
| F4 | Fix `DuelOverlay.tsx` type crash | S | [ ] | Add `attackerId: string`, `defenderId: string` to `DuelSummary` interface. Pass from `GameScreen`. `getWeaponImg` resolves correct asset. `revealedRole` displays "🚩 Flag!" or "🎭 Decoy!" when set. |
| F5 | `HUD` bar component | M | [ ] | `HUD.tsx` shows: phase label, turn label, reveal countdown (large, disappears post-reveal), difficulty badge, duel stats (W/L). `aria-live="polite"` on turn indicator. CSS variables only. |
| F6 | `EventLogPanel` component | S | [ ] | `EventLogPanel.tsx` renders `match.eventLog` as scrollable list. Auto-scrolls to latest entry. Collapsible. Placed alongside board in `GameScreen`. |
| F7 | `GameScreen` integration — wire all components | L | [ ] | `GameScreen` conditionally renders: reveal→`SquadBoard`+`HUD`+countdown; role_select→`RoleSelectScreen`; player/ai_turn→`SquadBoard`+`HUD`+`EventLogPanel`; repick→`DuelOverlay`+`HUD`; finished→`GameOverScreen`+`EventLogPanel`. All `useGame` callbacks passed correctly. No prop drilling beyond 2 levels. |
| F8 | `ActionFeedback` inline banner | S | [ ] | `ActionFeedback.tsx` renders `useGame.actionFeedback` with `info` (blue) and `warning` (amber) tones. Auto-clears after 3s. `actionHint` shown as subtle line above board. |

**Dependency order:**
```
B1 ──────────────────────► F3
B2, B3, B4  (parallel)
F2 ──► F1 ──► F7
F4 ──► F7
F5 ──► F7
F6 ──► F7
F8 ──► F7
```

---

## RELEASE BLOCKERS (must pass before demo)

- [ ] `SquadBoard.tsx` renders correct 5×6 grid (F1)
- [ ] `DuelOverlay` type crash fixed (F4)
- [ ] Role selection wired end-to-end (B1 + F3)
- [ ] Stalemate policy enforced (B2)
- [ ] Tie cap enforced (B3)
- [ ] Hidden-info audit test passes (B4)
- [ ] No `any` types in any new component
- [ ] `pytest` green (≥80% backend coverage)
- [ ] `vitest` green (≥80% frontend coverage)
- [ ] `ANTHROPIC_API_KEY` confirmed absent from all frontend bundles

---

## ARCHITECTURE NOTES (CTO decisions for Sprint 02)

| Decision | Choice | Reason |
|----------|--------|--------|
| Phase 2 state | Insert new `role_select` phase between `reveal` and `player_turn` | Clean state machine — avoids overloading reveal with role logic |
| Role selection timeout | 15s client timer → auto-assign if no POST received | Prevents hang; backend keeps authority |
| `SquadBoard` vs `GameBoard` | Full replacement | Old component is for a different game — extending it creates dead code debt |
| Stalemate policy | Lone Decoy becomes killable | Formally accepted in DECISIONS.md Sprint 01 — implement now |
| Tie cap | 5 ties → forced random resolution | Formally accepted in DECISIONS.md Sprint 01 — implement now |
