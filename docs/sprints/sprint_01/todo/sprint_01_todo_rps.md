# Sprint 01 — Squad RPS TODO
# CTO-generated | 2026-04-29 | Vibe Coding 101

> **Methodology:** TDD first. No code before tests. Quality Gate = 80% coverage.
> **Dependency order:** follow the numbered phases below strictly.

---

## Phase 0 — Canon Fixes (BLOCKER — must complete before any code)

| # | Task | Owner | Complexity | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| 0.1 | Founder decides canonical board size (5×6 vs 6×6) and unit name (decoy vs trap) | **Founder** | - | [ ] | Decision recorded in `DECISIONS.md`; CLAUDE.md, AGENTS.md, CtoAgent.md updated to match PRD |
| 0.2 | `[DOCS-RPS]` rewrites `ARCHITECTURE.md` for Squad RPS | `[DOCS-RPS]` | Medium | [ ] | No Memory Game types, flows, or modules remain; Squad RPS board, duel engine, hidden-info, and API contracts are documented |
| 0.3 | Update PRD model ID from `claude-sonnet-4-20250514` to `claude-sonnet-4-6` | `[DOCS-RPS]` | Small | [ ] | PRD Section 8 references `claude-sonnet-4-6` |

---

## Phase 1 — Shared Types & Domain Model (DEV-RPS)

| # | Task | Owner | Complexity | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| 1.1 | Write tests for canonical types, then define them | `[DEV-RPS]` | Small | [ ] | `Weapon`, `Role`, `UnitState`, `BoardPosition`, `GamePhase`, `DuelOutcome`, `Squad`, `GameState` exported from `frontend/modules/shared/src/types/` |
| 1.2 | Write tests for board constants, then define them | `[DEV-RPS]` | Small | [ ] | `BOARD_COLS`, `BOARD_ROWS`, `UNITS_PER_SQUAD`, `REVEAL_DURATION_MS` exported; values match canon decision from 0.1 |
| 1.3 | Delete all Memory Game type files | `[DEV-RPS]` | Small | [ ] | No `Card`, `GameStatus`, `Score`, `Theme`, `flippedIds`, `matchedPairs` anywhere in `frontend/modules/shared/` |

---

## Phase 2 — Game Logic Core (DEV-RPS, tests first)

| # | Task | Owner | Complexity | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| 2.1 | Write tests, then implement `resolveRPS(a, b): DuelOutcome` | `[DEV-RPS]` | Small | [ ] | All 9 weapon combinations covered; tie returns `TIE`; rock beats scissors; scissors beats paper; paper beats rock |
| 2.2 | Write tests, then implement `assignRoles(squad): Squad` | `[DEV-RPS]` | Small | [ ] | Exactly 1 Flag and 1 Decoy assigned per squad of 10; roles are random; other 8 remain `SOLDIER` |
| 2.3 | Write tests, then implement `isLegalAttack(gameState, attackerId, targetId): boolean` | `[DEV-RPS]` | Small | [ ] | Returns false if unit is dead, if attacker is not owned by current player, if target is friendly |
| 2.4 | Write tests, then implement `applyDuel(gameState, attackerId, targetId): GameState` | `[DEV-RPS]` | Medium | [ ] | Loser removed from board; Decoy survives all duels; Flag death sets `GAME_OVER`; winner's weapon hidden; turn advances |
| 2.5 | Write tests, then implement `checkWinCondition(gameState): WinResult` | `[DEV-RPS]` | Small | [ ] | Returns `PLAYER_WINS` on enemy Flag eliminated; `AI_WINS` on player Flag eliminated; `ONGOING` otherwise |
| 2.6 | Write tests, then implement Decoy stalemate resolver | `[DEV-RPS]` | Small | [ ] | When only enemy Decoy remains and player Flag is alive, Decoy becomes killable |

---

## Phase 3 — Python FastAPI Backend (DEV-RPS)

| # | Task | Owner | Complexity | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| 3.1 | Write tests, then implement `POST /api/squad/generate` | `[DEV-RPS]` | Medium | [ ] | Returns 2×10 characters each with `id`, `name`, `weapon` (balanced: ≥2 of each weapon per squad), `visualDescription`; roles NOT assigned here |
| 3.2 | Write tests, then implement `POST /api/ai/move` | `[DEV-RPS]` | Large | [ ] | Accepts game state visible to AI only (own squad + roles, enemy silhouettes + duel history); returns `{ attackerId, targetId, reasoning }`; API key never in response; timeout 3s with random-valid-move fallback |
| 3.3 | Write tests for hidden-info enforcement | `[QA-RPS]` | Medium | [ ] | Server never sends enemy roles or hidden weapons to the requesting client; verified by intercepting all `/api/ai/move` payloads |
| 3.4 | Implement request validation, timeout, and error normalization | `[DEV-RPS]` | Small | [ ] | Malformed requests return 422; Claude timeout returns fallback within 3s; `ANTHROPIC_API_KEY` never in response body |

---

## Phase 4 — React Frontend (DEV-RPS / ARIA-RPS)

> ARIA-RPS must define Tokens → Components → State Map before any component is built.

| # | Task | Owner | Complexity | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| 4.1 | `[ARIA-RPS]` defines full UI token set and component spec for Squad RPS | `[ARIA-RPS]` | Medium | [ ] | Token doc and component spec committed to `docs/ui/`; covers board cell states, unit states, battle overlay, info panel |
| 4.2 | Build `BoardCell` component with all states | `[DEV-RPS]` | Medium | [ ] | Renders: empty, playerUnit, enemyHidden, enemyRevealed, selected, validTarget, blocked |
| 4.3 | Build `Unit` component with weapon/role display logic | `[DEV-RPS]` | Medium | [ ] | Shows weapon when revealed; shows silhouette when hidden; shows Flag/Decoy marker to owning player only |
| 4.4 | Build `GameBoard` (5×6 or 6×6 per canon decision) | `[DEV-RPS]` | Medium | [ ] | Correct grid renders; player rows bottom, AI rows top, neutral zone in middle |
| 4.5 | Build `RevealPhase` with 10s countdown and lock | `[DEV-RPS]` | Medium | [ ] | Board locked during reveal; all weapons shown; countdown visible; at T=0 hide animation plays (< 600ms) |
| 4.6 | Build `DuelFlow`: select attacker → select target → resolve → reveal/hide | `[DEV-RPS]` | Large | [ ] | Both weapons shown during duel; winner's weapon hidden afterward; loser removed; tie re-pick loop works; Decoy stays |
| 4.7 | Build `GameOver` screen with full reveal and stats | `[DEV-RPS]` | Medium | [ ] | Shows Win/Loss reason; all enemy roles + weapons revealed; match duration, duels won/lost, ties, Decoy absorptions shown; Play Again works |
| 4.8 | Build loading state for squad generation | `[DEV-RPS]` | Small | [ ] | Spinner shown during `POST /api/squad/generate`; fallback roster used if API fails |

---

## Phase 5 — QA Sign-Off (QA-RPS)

| # | Task | Owner | Complexity | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| 5.1 | Write E2E test: full match win-by-Flag | `[QA-RPS]` | Medium | [ ] | Playwright covers: reveal phase → role assignment → duel rounds → Flag eliminated → Game Over screen |
| 5.2 | Write E2E test: Decoy interaction | `[QA-RPS]` | Medium | [ ] | Playwright verifies Decoy survives attack; attacker dies if they would have lost; Decoy stays on board |
| 5.3 | Write E2E test: tie resolution loop | `[QA-RPS]` | Small | [ ] | Tie triggers re-pick; loop resolves until non-tie; no infinite loop |
| 5.4 | Verify hidden-info: no client receives enemy hidden state | `[QA-RPS]` | Medium | [ ] | Network intercept confirms enemy roles and hidden weapons never in client-bound payloads until legally revealed |
| 5.5 | Run coverage report — Quality Gate check | `[QA-RPS]` | Small | [ ] | Total coverage ≥ 80%; report attached to sprint review |
| 5.6 | Release checklist sign-off | `[QA-RPS]` | Small | [ ] | No API key in browser bundle; all PRD success criteria checked; no open P0 bugs |

---

## Dependency Order

```
0.1 → 0.2 → 0.3
         ↓
        1.1 → 1.2 → 1.3
                      ↓
              2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6
                                              ↓
                              3.1 → 3.2 → 3.3 → 3.4
                                                  ↓
                              4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.7 → 4.8
                                                                             ↓
                                                          5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6
```

---

## Release Blockers

These tasks block demo sign-off:

- `0.1` — canon conflict unresolved
- `0.2` — ARCHITECTURE.md still describes wrong game
- `2.4` — duel engine not implemented
- `3.2` — AI move endpoint not implemented
- `3.3` — hidden-info enforcement not verified
- `5.5` — coverage < 80%
- `5.6` — release checklist not signed off
- Any `ANTHROPIC_API_KEY` found in browser bundle
