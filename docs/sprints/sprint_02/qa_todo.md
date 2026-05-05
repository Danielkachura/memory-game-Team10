# Sprint 02 — qa_todo.md
# Squad RPS — Team 10
# Author: CTO → QA Lead executes
# Companion to: dev_todo.md

---

## QA principle for this sprint
Every task in dev_todo has at least one automated test. No task is marked done until
its test is green and the QA Lead has run it locally. Manual smoke tests supplement
but do not replace automated tests.

---

## BACKEND — pytest scenarios

### QA-B1 — Dead piece role reveal in `visible_piece()`

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| B1-1 | Dead enemy piece role is revealed in board payload | 1. Create match. 2. Complete reveal. 3. Manually kill an AI piece and set its role to `"flag"`. 4. GET `/api/match/{id}`. | Board payload: dead AI piece has `role: "flag"`, `roleIcon: "🚩"`, `alive: false`. |
| B1-2 | Alive enemy piece role stays hidden | Same match, alive AI piece. | `role: null`, `roleIcon: null`, `silhouette: true`. |
| B1-3 | Own dead piece role is visible | Kill a player piece with role `"decoy"`. GET match. | Dead player piece has `role: "decoy"`, `roleIcon: "🎭"`. |
| B1-4 | Regression: alive enemy weapon still null post-reveal | After reveal/complete, alive AI piece. | `weapon: null`, `weaponIcon: null`. |

### QA-B2 — Decoy stalemate

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| B2-1 | Lone Decoy absorbs attack normally (no stalemate yet) | 9 AI pieces dead, 1 Decoy alive. Player attacks Decoy. Decoy is not in stalemate mode. | Attacker dies (if RPS says so). Decoy stays. `decoy_stalemate` not set. |
| B2-2 | Lone Decoy becomes killable when it is the last AI piece | Manually set all AI pieces dead except one with `role: "decoy"`. Trigger any duel resolution. | `match_state["decoy_stalemate"] == True`. Event log contains "Decoy stalemate". |
| B2-3 | Stalemate Decoy can be killed | After B2-2, player attacks the Decoy and wins RPS. | Decoy is eliminated (`alive: False`). Match ends with player victory. |
| B2-4 | Stalemate Decoy: attacker does NOT die when winning | Player wins RPS vs stalemate Decoy. | Attacker stays alive. Decoy is eliminated. |
| B2-5 | Stalemate Decoy: attacker still dies when losing | Player loses RPS vs stalemate Decoy. | Attacker is eliminated. Decoy stays alive (but still killable next turn). |

### QA-B3 — Tie cap

| ID | Scenario | Steps | Expected |
|----|----------|-------|----------|
| B3-1 | 4 consecutive ties do not force resolution | Submit 4 tie-repick pairs (same weapon each time). | Phase remains `repick` after each. `tie_count == 4`. |
| B3-2 | 5th tie triggers forced resolution | Submit 5th tie repick. | Phase exits `repick`. A winner is determined. `phase` is `player_turn` or `ai_turn` or `finished`. |
| B3-3 | Forced resolution is logged | After B3-2. | Event log contains "Forced resolution after 5 consecutive ties." |
| B3-4 | Canonical weapons not mutated after forced resolution | After B3-2, inspect piece objects directly. | `piece["weapon"]` matches its pre-duel value for both pieces. |
| B3-5 | tie_count resets on a new duel | Start a new duel after a tie-resolved duel. | `pending_repick["tie_count"] == 0` for the new duel. |

### QA-B4 — Hidden-info regression suite

| ID | Scenario | Expected |
|----|----------|----------|
| B4-1 | During `reveal` phase — all 20 pieces have non-null weapon | `weapon` and `weaponIcon` non-null for all pieces. `silhouette: false` for all. |
| B4-2 | During `player_turn` — own pieces visible | Player pieces: `weapon` non-null, `silhouette: false`. |
| B4-3 | During `player_turn` — enemy pieces hidden | AI pieces: `weapon: null`, `weaponIcon: null`, `silhouette: true`, `role: null`, `roleIcon: null`. |
| B4-4 | During `repick` — response does not expose AI's chosen weapon | `repick` object in response contains `attackerId`, `targetId`, `picksReceived`. No `aiWeapon` field. |
| B4-5 | After `finished` — all pieces revealed | Every piece has non-null `weapon`, `role` (except soldiers whose role stays null or "soldier"). |

### QA-B5 — CORS allowlist

| ID | Scenario | Expected |
|----|----------|----------|
| B5-1 | OPTIONS request from `http://localhost:5173` | 200, `Access-Control-Allow-Origin: http://localhost:5173`. |
| B5-2 | OPTIONS request from an untrusted origin | CORS header absent or origin not echoed back. |

---

## FRONTEND — Vitest scenarios

### QA-F1 — DuelOverlay crash fix

| ID | Scenario | Expected |
|----|----------|----------|
| F1-1 | Render `DuelOverlay` with full duel object (includes `attackerId`, `defenderId`) | No thrown error. Component mounts. |
| F1-2 | `attackerId` starts with `"player"` → player weapon image used | `img[src]` matches a `PLAYER_WEAPON_IMG` entry. |
| F1-3 | `attackerId` starts with `"ai"` → AI weapon image used | `img[src]` matches an `AI_WEAPON_IMG` entry. |
| F1-4 | `winner: "tie"` → shows `=` symbol, shows repick buttons | `"="` text visible. 3 weapon buttons rendered when `repick={true}`. |
| F1-5 | `onRepick` called with correct weapon when button clicked | Mock `onRepick`. Click "rock" button. Assert called with `"rock"`. |

### QA-F2 — GameBoard.tsx deleted

| ID | Scenario | Expected |
|----|----------|----------|
| F2-1 | `GameBoard.tsx` does not exist in the repository | `ls frontend/modules/game/src/components/GameBoard.tsx` → file not found. |
| F2-2 | No import of `GameBoard` anywhere in the codebase | `grep -r "GameBoard"` → zero results. |
| F2-3 | `tsc --noEmit` passes after deletion | Zero TypeScript errors. |

### QA-F3 — Shared types replacement

| ID | Scenario | Expected |
|----|----------|----------|
| F3-1 | `shared/types/game.ts` exports no Memory Game types | `grep "Card\|GameState\|GameStatus\|Theme\|Score" shared/src/types/game.ts` → zero results. |
| F3-2 | `VisiblePiece` is importable from `@shared` | Import compiles without error. |
| F3-3 | No file in the codebase imports `Card` or `GameState` from `@shared` | `grep -r "import.*Card.*from '@shared'" src/` → zero results. |

### QA-F4 — Dead piece role badge in UnitSprite

| ID | Scenario | Expected |
|----|----------|----------|
| F4-1 | Render `UnitSprite` with dead AI piece `role: "flag"` | 🚩 badge or equivalent element visible in rendered output. |
| F4-2 | Render `UnitSprite` with dead AI piece `role: "decoy"` | 🎭 badge visible. |
| F4-3 | Render `UnitSprite` with dead AI piece `role: "soldier"` | No badge rendered. |
| F4-4 | Render `UnitSprite` with alive AI piece (silhouette) | No role badge — role is still hidden. |

### QA-F5 — DuelOverlay revealedRole banner

| ID | Scenario | Expected |
|----|----------|----------|
| F5-1 | Render with `duel.revealedRole: "flag"` | Banner text contains "Flag" (or 🚩). Highly visible (large font or highlight color). |
| F5-2 | Render with `duel.revealedRole: "decoy"` | Banner text contains "Decoy" (or 🎭). |
| F5-3 | Render with `duel.revealedRole: "soldier"` or undefined | No extra banner rendered. |

### QA-F7 — Debug log panel renders eventLog entries

| ID | Scenario | Expected |
|----|----------|----------|
| F7-1 | Render `GameScreen` with 3 eventLog entries | 3 entries visible in the debug log panel. Turn numbers shown. |
| F7-2 | Entry containing "Forced resolution after 5 consecutive ties" | That text visible in the panel when present. |
| F7-3 | Entry containing "Decoy stalemate" | That text visible in the panel when present. |

---

## END-TO-END — Playwright scenarios

### QA-E2E-1 — Full VS-AI match: win by flag

| Step | Action | Expected |
|------|--------|----------|
| 1 | Load app → "Play vs Claude" → Start Match (Easy) | Board renders 20 pieces. Reveal phase. Countdown visible. |
| 2 | Wait for countdown to reach 0 (or call `__SQUAD_RPS_TEST__.finishReveal()`) | Enemy weapons disappear. Phase becomes `player_turn`. |
| 3 | Click a player piece on row 1 or 2 | Piece selected. Legal move cells highlighted blue. |
| 4 | Click a highlighted blue cell | Piece moves. Phase becomes `ai_turn`. Board updates after ~1s. |
| 5 | Repeat move/attack turns until a flag is eliminated | Match ends. Result panel shows "Victory" or "Defeat". Reason shown. |
| 6 | Click "Play Again" | New match starts. Reveal phase begins again. |

### QA-E2E-2 — Tie repick loop

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start match. Manually set a player and AI piece adjacent with same weapon (via test helper or backend state). | - |
| 2 | Attack the adjacent enemy. | Phase becomes `repick`. DuelOverlay shows `=` and weapon buttons. |
| 3 | Click any weapon. | AI picks a weapon. If still a tie → repick again. If resolved → phase exits repick. |
| 4 | After at most 5 rounds | A winner is declared. Phase not stuck in repick. |

### QA-E2E-3 — Decoy interaction

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start match. Force AI piece to be a Decoy adjacent to player piece. | - |
| 2 | Player attacks the Decoy and wins RPS. | DuelOverlay shows `decoyAbsorbed`. Decoy remains on board. Attacker stays alive. |
| 3 | Player attacks the Decoy and loses RPS. | DuelOverlay shows player lost. Attacker eliminated. Decoy stays on board. |

### QA-E2E-4 — Hidden-info browser check (security)

| Step | Action | Expected |
|------|--------|----------|
| 1 | Start match. Open DevTools → Network tab. | - |
| 2 | Observe `POST /api/match/create` and `POST /api/match/{id}/reveal/complete` responses. | JSON for alive AI pieces has `weapon: null`, `role: null`, `silhouette: true`. |
| 3 | Run `window.__SQUAD_RPS_TEST__.getState()` in console. | Confirm no AI weapon or role data is accessible in JS state. |
| 4 | Search built JS bundle: `grep -r "ANTHROPIC" dist/` | Zero results. |

---

## QA sign-off checklist (gate for Sprint 02 close)

- [ ] All backend pytest scenarios green (B1-1 through B5-2)
- [ ] All Vitest scenarios green (F1-1 through F7-3)
- [ ] E2E-1 full match passes in Playwright (Chrome)
- [ ] E2E-2 tie repick loop confirmed
- [ ] E2E-3 Decoy interaction confirmed
- [ ] E2E-4 hidden-info check passes
- [ ] `tsc --noEmit` zero errors
- [ ] `GameBoard.tsx` and `MemoryCard.tsx` confirmed deleted
- [ ] `shared/types/game.ts` contains no Memory Game types
- [ ] `ANTHROPIC_API_KEY` absent from `dist/` bundle
- [ ] CTO plays one full match end-to-end. No crash. No freeze. Flag death ends the match.
