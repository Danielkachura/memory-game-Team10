# Sprint 02 — dev_todo.md
# Squad RPS — Team 10
# Author: CTO
# Based on: full code audit of app.py, useGame.ts, GameScreen.tsx, UnitSprite.tsx,
#            DuelOverlay.tsx, GameBoard.tsx, test_app.py, App.tsx, PRD.md

---

## Sprint Goal
**Close every gap between the PRD and the running code.**
After this sprint, a first-time observer can play a complete match — reveal → duel → flag death — without hitting a crash, a missing phase, or a rules violation.

---

## What the audit found

### 🔴 BUGS / CRASHES (must fix before any demo)

**BUG-1 — `DuelOverlay` uses `unitId` but the interface has no such field**
`getWeaponImg(weapon, unitId)` is called inside `WeaponCard`, but the local `DuelSummary`
interface in `DuelOverlay.tsx` declares only `attackerName`, `defenderName`, `attackerWeapon`,
`defenderWeapon`, `winner`. There is no `attackerId` or `defenderId`.
`GameScreen` passes `match.duel` which *does* contain those fields (from `useGame.ts`), but
TypeScript silently accepts it because the prop type is the *narrow* local interface.
At runtime `unitId` is `undefined` → `unitId.startsWith(...)` throws.

**BUG-2 — `GameBoard.tsx` is the wrong component entirely**
`GameBoard` renders a memory-card grid, imports `Card` from `@shared`, and has nothing to do
with the 5×6 squad board. It is not used by `GameScreen` (which uses `boardCells` and
`UnitSprite` inline). The file is dead code that will confuse every new developer who opens it.

**BUG-3 — `visible_piece()` reveals dead enemy roles incorrectly**
```python
"role": piece["role"] if show_role and piece["alive"] else None,
```
When a piece dies its role should be revealed (PRD §3: "Their identity (role) is revealed at
the moment of death"). The current guard `and piece["alive"]` hides the role on dead pieces
even for the viewer — so the duel summary's `revealedRole` is the only way the player learns
the role. The board never shows the dead piece's role. This contradicts the PRD and makes the
Flag-death moment unreadable.

**BUG-4 — CORS is `allow_origins=["*"]` — security regression**
A previous version used a strict allowlist. The current `app.py` opens CORS to all origins.
For a hackathon-localhost demo this is low-risk, but it contradicts the security decision log
and must be noted as a known regression to fix before any public deployment.

### ⚠️ MISSING FEATURES (PRD-required, not yet built)

**MISSING-1 — Decoy stalemate rule not implemented**
PRD §9: "when only the Decoy remains, it becomes killable". Currently if all enemy pieces die
except the Decoy, the Decoy continues to absorb attacks forever and the match never ends.
`choose_ai_move` logs a message but does nothing.

**MISSING-2 — Tie cap (5 consecutive ties → forced resolution) not implemented**
PRD §9 flags this as a risk. `pending_repick` has no `tie_count` field. A pathological game
can tie indefinitely.

**MISSING-3 — `visible_piece()` leaks own dead piece role too early**
After a player's own piece dies, `show_role` is `True` for the owner — this is correct. But
enemy dead pieces also eventually need their role revealed in the board view (not just the duel
summary). See BUG-3 above.

**MISSING-4 — No hidden-info regression test**
There is one test (`test_reveal_completion_hides_enemy_state`) that checks `weapon is None`,
but it does not check `role`, `roleIcon`, or `silhouette`. A future change to `visible_piece()`
could leak roles with no test catching it.

**MISSING-5 — `shared/types/game.ts` is the old Memory Game type file**
`Card`, `GameState`, `GameStatus`, `Theme`, `Score` — none of these exist in Squad RPS.
Any developer who imports from `@shared/types/game` gets the wrong types. The file needs to
be replaced with Squad RPS types (`VisiblePiece`, `MatchView`, `Weapon`, etc.) or cleared.

---

## Tasks

### BACKEND

| # | Task | Complexity | Status | What to do |
|---|------|-----------|--------|------------|
| B1 | Fix `visible_piece()` dead-piece role reveal | S | [ ] | Remove the `and piece["alive"]` guard from the role reveal logic. Dead enemy pieces should expose `role` and `roleIcon` in the board payload after death. Write a pytest to confirm. |
| B2 | Implement Decoy stalemate rule | M | [ ] | After every `apply_duel_outcome`, check: if all remaining enemy pieces are role `"decoy"`, set `match_state["decoy_stalemate"] = True` and log it. In `resolve_attack`, skip the decoy-absorbs-attacker block when `decoy_stalemate` is True. Write a pytest. |
| B3 | Implement tie cap (5 ties → forced resolution) | S | [ ] | Add `"tie_count": 0` to `pending_repick` in `resolve_attack`. Increment on each tie. At `tie_count == 5`, call `random.choice(WEAPONS)` for the AI weapon and force `apply_duel_outcome` instead of entering repick again. Log "Forced resolution after 5 consecutive ties." Write a pytest. |
| B4 | Add hidden-info regression test for role + silhouette fields | S | [ ] | Add to `test_app.py`: after reveal/complete, assert all alive enemy pieces have `role: null`, `roleIcon: null`, `silhouette: true`. After a piece dies, assert its `role` is now non-null in the board payload. |
| B5 | Restore strict CORS allowlist | S | [ ] | Revert `allow_origins=["*"]` to the environment-variable-driven allowlist that was in the previous version. Keep `http://localhost:5173` and `http://localhost:8000` as defaults. |

### FRONTEND

| # | Task | Complexity | Status | What to do |
|---|------|-----------|--------|------------|
| F1 | Fix `DuelOverlay.tsx` — add missing `attackerId`/`defenderId` to local interface | S | [ ] | Add `attackerId: string` and `defenderId: string` to the local `DuelSummary` interface inside `DuelOverlay.tsx`. Verify `getWeaponImg` now resolves correctly. Add a Vitest render test that passes a full duel object and confirms no crash and correct image selection. |
| F2 | Delete `GameBoard.tsx` (dead Memory Game code) | S | [ ] | Delete `frontend/modules/game/src/components/GameBoard.tsx` and `MemoryCard.tsx` if it has no other users. Remove any import of either file. Confirm no TypeScript errors. |
| F3 | Replace `shared/types/game.ts` with Squad RPS types | M | [ ] | Replace the content of `frontend/modules/shared/src/types/game.ts` with Squad RPS types: re-export `VisiblePiece`, `MatchView`, `Weapon`, `Owner`, `Phase`, `Difficulty` from `useGame.ts` or declare them canonically here and import into `useGame.ts`. Remove `Card`, `GameState`, `GameStatus`, `Theme`, `Score`. Update any imports that referenced the old types. |
| F4 | Show revealed role on dead pieces in the board | S | [ ] | `UnitSprite` currently renders the role flag only for alive pieces with a role. After B1, dead enemy pieces will have `role` set. Render a small 🚩/🎭 badge on dead (greyed-out) pieces in the board so the player can see which piece was the Flag/Decoy after elimination. |
| F5 | DuelOverlay: show `revealedRole` banner | S | [ ] | When `duel.revealedRole` is `"flag"` or `"decoy"`, render a prominent banner inside `DuelOverlay`: e.g. "🚩 FLAG CAPTURED — MATCH OVER" or "🎭 Decoy — target is invulnerable". This is the PRD-required moment of role reveal at death. |
| F6 | Decoy stalemate UI notice | S | [ ] | When `match_state["decoy_stalemate"]` is True, the backend message will say so. Surface this in the HUD — a small banner: "Lone Decoy remaining — now killable." No new API needed; the `match.message` field already carries this. |
| F7 | Tie cap UI notice | S | [ ] | After a forced tie resolution (B3), the event log will contain "Forced resolution after 5 consecutive ties." No extra frontend work needed beyond verifying the debug log panel renders it. Write a Vitest test that confirms the debug log panel renders arbitrary `eventLog` entries. |
| F8 | Vitest: DuelOverlay crash regression test | S | [ ] | See F1. Render `<DuelOverlay duel={fullDuelObject} visible={true} />` in Vitest and assert no thrown error and correct `img` src. |

---

## Dependency order

```
B1 ──► B4 (write test after fix)
B2 ──► B4 (test covers stalemate role reveal)
B3 (independent)
B5 (independent)

F1 ──► F8 (write test after fix)
F2 (independent, delete only)
F3 (independent, type cleanup)
F4 ──── depends on B1 being deployed (dead piece roles now in payload)
F5 ──── depends on F1 (DuelOverlay interface fixed first)
F6 (independent — reads match.message)
F7 ──── depends on B3 being deployed (event log now contains the message)
```

Start order: **B1, B3, B5, F1, F2, F3** can all begin in parallel today.
**B2, F4, F5** follow once B1 is merged.

---

## Release blockers (nothing ships without these)

- [ ] BUG-1 fixed — no runtime crash in DuelOverlay (F1 + F8)
- [ ] BUG-2 resolved — GameBoard.tsx deleted (F2)
- [ ] BUG-3 fixed — dead piece roles visible in board (B1 + F4)
- [ ] MISSING-1 implemented — Decoy stalemate (B2)
- [ ] MISSING-2 implemented — Tie cap (B3)
- [ ] MISSING-4 added — hidden-info regression test (B4)
- [ ] `pytest` fully green
- [ ] `vitest` fully green
- [ ] `tsc --noEmit` zero errors
- [ ] ANTHROPIC_API_KEY absent from any built JS file

---

## Architecture notes (CTO decisions for Sprint 02)

| Decision | Choice | Reason |
|----------|--------|--------|
| Dead piece role reveal | Remove `and piece["alive"]` guard in `visible_piece()` | PRD is explicit: role revealed at moment of death. Duel summary alone is insufficient — board state must also reflect it. |
| Stalemate | Last lone Decoy becomes killable via `decoy_stalemate` flag | Accepted in DECISIONS.md. Implement now — the AI fallback already logs the gap. |
| Tie cap | 5 ties → random forced resolution, logged | Accepted in DECISIONS.md. Prevents infinite loop in AI path. |
| `shared/types/game.ts` | Replace entirely with Squad RPS types | Old Memory Game types are actively misleading. No Squad RPS code imports them today so replacement is safe. |
| CORS | Restore env-var allowlist | `allow_origins=["*"]` is a security regression. Localhost default is sufficient for the demo. |
