# Sprint 02 — qa_todo.md
# Squad RPS — Team 10

**QA Lead objective:** Verify every new feature with tests before it ships. No feature merges without a passing test and a QA sign-off comment on the task.

---

## BACKEND TEST SCENARIOS (pytest)

### QA-B1 — Role Assignment endpoint

| # | Scenario | Expected |
|---|----------|----------|
| B1-1 | POST roles with valid `flagId` + `decoyId` (both owned by player, both alive, distinct) | 200. Phase transitions to `player_turn`. Both pieces have correct roles in full state. |
| B1-2 | POST roles where `flagId === decoyId` | 400. "Flag and Decoy must be different pieces." |
| B1-3 | POST roles where `flagId` belongs to AI | 400. "Invalid piece ownership." |
| B1-4 | POST roles with a dead piece ID | 400. "Piece is not alive." |
| B1-5 | POST roles when phase is `player_turn` (already past reveal) | 400. "Role assignment not allowed in this phase." |
| B1-6 | POST roles with a non-existent piece ID | 400 or 404. |
| B1-7 | After assignment, call `GET /api/match/{id}` — verify enemy role fields are null in response | `role` and `roleIcon` are null for all AI pieces in player view. |

### QA-B2 — Stalemate detection

| # | Scenario | Expected |
|---|----------|----------|
| B2-1 | Player attacks the last remaining AI piece, which is a Decoy. `decoy_stalemate` is False. | Attacker dies. Decoy survives. Match continues. |
| B2-2 | All AI pieces are Decoys (manually set up state). Player attacks a Decoy. | `decoy_stalemate` becomes True. Decoy is now killable. Attacker does NOT die. Normal RPS resolves. |
| B2-3 | Stalemate event is logged | Event log contains "Decoy stalemate — Decoy is now killable." |

### QA-B3 — Tie cap

| # | Scenario | Expected |
|---|----------|----------|
| B3-1 | 4 consecutive ties submitted → 5th repick | 5th repick is offered normally (no forced resolution yet). |
| B3-2 | 5th consecutive tie submitted | Forced resolution fires. Winner is determined randomly. Phase exits `repick`. No 6th repick offered. |
| B3-3 | Forced resolution is logged | Event log contains "Forced resolution after 5 consecutive ties." |
| B3-4 | After forced resolution, canonical piece weapons are unchanged | The pieces' `weapon` fields match their pre-duel values — tie repick weapons did not mutate them. |

### QA-B4 — Hidden-info security audit

| # | Scenario | Expected |
|---|----------|----------|
| B4-1 | `GET /api/match/{id}` during `reveal` phase | All pieces have non-null `weapon` and `weaponIcon`. All pieces have `silhouette: false`. |
| B4-2 | `GET /api/match/{id}` during `player_turn` phase | Own pieces: `weapon` non-null. Enemy pieces: `weapon: null`, `weaponIcon: null`, `silhouette: true`. |
| B4-3 | `GET /api/match/{id}` during `player_turn` — enemy role fields | Enemy `role: null`, `roleIcon: null` for all alive AI pieces. |
| B4-4 | After an enemy piece dies, `GET /api/match/{id}` | Dead enemy piece has `alive: false`. Its `role` and `roleIcon` are now revealed. Its coordinates are preserved but it does not block movement. |
| B4-5 | During `repick` phase, call `GET /api/match/{id}` | The `repick` object contains `attackerId`, `targetId`. It does NOT contain the AI's chosen weapon. |
| B4-6 | After a duel resolves (not a tie), duel summary in response | `attackerWeapon` and `defenderWeapon` are present in `duel` object. No other hidden weapons exposed. |

---

## FRONTEND TEST SCENARIOS (Vitest + Testing Library)

### QA-F1 — SquadBoard renders correctly

| # | Scenario | Expected |
|---|----------|----------|
| F1-1 | Render `SquadBoard` with 20 pieces at correct positions | All 30 cells render. Pieces appear in correct row/col cells. |
| F1-2 | Render with `selectedAttackerId` set + `legalMoveTargets` | Target cells have blue highlight class. Non-target cells do not. |
| F1-3 | Render with `legalAttackTargets` set | Enemy target cells have attack highlight class. |
| F1-4 | Render during `reveal` phase | All pieces show weapon icon. |
| F1-5 | Render during `player_turn` phase — enemy piece | Enemy piece shows no weapon icon. Silhouette style applied. |
| F1-6 | Dead piece not rendered in board | A piece with `alive: false` does not appear in any cell. |
| F1-7 | Click on own alive piece calls `onPieceClick` | `onPieceClick` called with correct `VisiblePiece`. |
| F1-8 | Click on empty legal move cell calls `onEmptyCellClick` | `onEmptyCellClick` called with correct `row, col`. |

### QA-F2 — UnitToken component

| # | Scenario | Expected |
|---|----------|----------|
| F2-1 | Render player piece with `weapon: "rock"` | Rock weapon icon visible. Player sprite shown. |
| F2-2 | Render AI piece with `silhouette: true` | No weapon icon. Silhouette class applied. |
| F2-3 | Render own flag piece (`role: "flag"`) | 🚩 icon visible. |
| F2-4 | Render own decoy piece (`role: "decoy"`) | 🎭 icon visible. |
| F2-5 | Render with `isSelected: true` | Selected highlight/pulse class applied. |
| F2-6 | Render AI piece — role is null in props | No role icon rendered (enemy role hidden). |

### QA-F3 — RoleSelectScreen

| # | Scenario | Expected |
|---|----------|----------|
| F3-1 | Render with 10 player pieces | All 10 pieces listed as selectable. Confirm button disabled. |
| F3-2 | Click one piece → Flag | Piece marked as Flag. "🚩 Flag" badge appears. Confirm still disabled (no Decoy yet). |
| F3-3 | Click second (different) piece → Decoy | Piece marked as Decoy. "🎭 Decoy" badge appears. Confirm button enabled. |
| F3-4 | Try to click same piece for both roles | Second click deselects first role or shows error — same piece cannot be both. |
| F3-5 | Click Confirm | Calls POST `/api/match/{id}/roles/assign` with correct `flagId` + `decoyId`. |
| F3-6 | Backend returns 400 | Error message displayed inline. Pieces remain selectable. |

### QA-F4 — DuelOverlay fix

| # | Scenario | Expected |
|---|----------|----------|
| F4-1 | Render with complete `DuelSummary` including `attackerId`, `defenderId` | No TypeScript error. Correct images rendered for each side. |
| F4-2 | Render with `winner: "tie"` and `repick: true` | "=" symbol shown. Weapon selection buttons appear. |
| F4-3 | Render with `revealedRole: "flag"` | "🚩 Flag!" displayed on eliminated piece side. |
| F4-4 | Render with `revealedRole: "decoy"` | "🎭 Decoy!" displayed. |
| F4-5 | Click a weapon in repick mode | `onRepick` called with correct `Weapon` value. |

### QA-F5 — HUD bar

| # | Scenario | Expected |
|---|----------|----------|
| F5-1 | Render during `reveal` phase with `revealSecondsLeft: 7` | Countdown shows "7". Phase label shows "Weapon Reveal". |
| F5-2 | Render during `player_turn` | Turn label shows "Your move". Countdown not rendered. |
| F5-3 | Render during `ai_turn` | Turn label shows "Claude thinking". |
| F5-4 | Render with stats `playerDuelsWon: 3, playerDuelsLost: 1` | "3W / 1L" or equivalent shown. |
| F5-5 | `aria-live="polite"` present on turn indicator | Accessibility attribute confirmed in DOM. |

### QA-F8 — ActionFeedback

| # | Scenario | Expected |
|---|----------|----------|
| F8-1 | Render with `tone: "warning"` message | Amber/yellow style applied. Message text visible. |
| F8-2 | Render with `tone: "info"` message | Blue style applied. |
| F8-3 | After 3 seconds, feedback clears | Banner no longer rendered (or `null`/hidden). |
| F8-4 | `actionHint` text renders above board | Hint text visible in correct position. |

---

## END-TO-END TEST SCENARIOS (Playwright)

### QA-E2E-1 — Full VS-AI match loop

| Step | Action | Expected |
|------|--------|----------|
| 1 | Load app, click "Start Match" (Easy difficulty) | Board renders with 20 pieces. Reveal phase begins. Timer visible. |
| 2 | Wait 10s (or call `__SQUAD_RPS_TEST__.finishReveal()`) | Enemy weapons hidden. `RoleSelectScreen` appears. |
| 3 | Click first player piece → "Flag" | Piece marked 🚩. |
| 4 | Click second player piece → "Decoy" | Piece marked 🎭. Confirm enabled. |
| 5 | Click "Confirm" | Transitions to `player_turn`. Board interactive. |
| 6 | Click a player piece | Legal moves highlighted blue. Adjacent enemies highlighted red/orange. |
| 7 | Click an empty legal cell | Piece moves. Phase switches to `ai_turn`. |
| 8 | Wait for AI move | AI moves within 3 seconds. Board updates. Phase returns to `player_turn`. |
| 9 | Trigger a duel (move into enemy-adjacent square, then attack) | `DuelOverlay` appears with both weapons. Winner determined. |
| 10 | If tie occurs | Repick weapon buttons appear. Select a weapon. Resolves. |
| 11 | Continue until a Flag is eliminated | Win/loss screen shown. Match result displayed. |

### QA-E2E-2 — Hidden-info browser check

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start match, wait for `player_turn` | Open browser DevTools → Network tab |
| 2 | Inspect `GET /api/match/{id}` response | Enemy pieces have `weapon: null`, `role: null` in JSON |
| 3 | Inspect JS state via `__SQUAD_RPS_TEST__.getState()` | Confirm no enemy weapon data accessible from client state |

### QA-E2E-3 — Stalemate scenario

| Step | Action | Expected |
|------|--------|----------|
| 1 | Set up match where only enemy Decoy remains (requires test helper or manual state manipulation) | `decoy_stalemate` flag set in backend |
| 2 | Player attacks the lone Decoy | Duel resolves normally (Decoy is killable). Attacker can win. |

---

## QA SIGN-OFF CHECKLIST (before Sprint 02 merge)

- [ ] All B1–B4 pytest tests green
- [ ] All F1–F8 Vitest tests green
- [ ] E2E-1 full match loop passes in Playwright
- [ ] E2E-2 hidden-info check passes
- [ ] No TypeScript compiler errors (`tsc --noEmit`)
- [ ] No `any` types in new components (grep clean)
- [ ] `ANTHROPIC_API_KEY` does not appear in built JS bundle (`grep -r "ANTHROPIC" dist/`)
- [ ] Backend test coverage ≥ 80% (`pytest --cov`)
- [ ] Frontend test coverage ≥ 80% (`vitest --coverage`)
- [ ] Demo run: CTO plays one full match, QA Lead observes, no crash or freeze
