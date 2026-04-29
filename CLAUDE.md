# ARIA-RPS | Claude Code Project Context

> **Purpose:** Command and workflow context for the synchronized RPS Tactical agent system.
>
> This file is auto-loaded by Claude Code CLI when you open this project directory.

---

## 1. Active Command Source

The canonical UI and product-system prompt is:

- `.claude/commands/CtoAgent.md`

The repo-level coordination file is:

- `AGENTS.md`

---

## 2. Active Slash Commands

| Command | Purpose |
|---|---|
| `/project:cto` | Activate the ARIA-RPS CTO workflow |
| `/project:aria-rps` | Activate the direct ARIA-RPS UI-system-first workflow |
| `/project:dev-rps` | Activate the DEV-RPS game-logic workflow |
| `/project:qa-rps` | Activate the QA-RPS game-testing workflow |
| `/project:docs-rps` | Activate the DOCS-RPS technical writing workflow |
| `/project:content-rps` | Activate the CONTENT-RPS narrative & micro-copy workflow |
| `/project:analyst-rps` | Activate the ANALYST-RPS balance & economy workflow |
| `/project:plan` | Force plan mode before complex work |
| `/project:test` | Run the unit test suite |
| `/project:e2e` | Run browser end-to-end tests |

---

## 3. UI System Rule

No UI generation is valid unless it follows this order:

1. `Step 1 -> Tokens`
2. `Step 2 -> Components`
3. `Step 3 -> State Map`
4. `Step 4 -> UI`

---

## 4. Shared RPS Canon

All active project agents share this gameplay baseline:

- board size: `5×6` (5 columns × 6 rows — 30 squares total)
- unit types: `rock`, `paper`, `scissors`, `flag`, `decoy`
- owners: `player`, `ai`
- team size: 10 units per side (20 total on board)
- movement: MVP uses direct attack selection — no tile movement
- immovable units: `flag`, `decoy` (decoy survives all attacks and never moves)
- battle reveal: both units reveal during duel; winner's weapon hides again after; loser removed
- win conditions:
  - defeat the enemy `flag` → instant win
  - enemy `flag` is captured → opponent loses instantly
- role assignment: 1 Flag + 1 Decoy per squad, assigned randomly after the 10s reveal phase

Canonical game phases:

- `reveal` — 10s, all weapons shown, board locked
- `player_turn` — player selects attacker and target
- `ai_turn` — Claude picks the AI move
- `repick` — tie resolution, both sides pick new weapons
- `finished` — match over, full reveal shown

Claude model: `claude-sonnet-4-6`

Active synchronized roles:

- `ARIA-RPS` for UI system and state-to-UI mapping
- `DEV-RPS` for deterministic Python game logic
- `QA-RPS` for rule validation, exploit hunting, and sign-off risk
- `DOCS-RPS` for documentation, architecture records, and integration guides
- `CONTENT-RPS` for unit lore, system messages, and all in-game copy
- `ANALYST-RPS` for balance math, force composition, and difficulty scaling

---

## 5. Workflow

1. `ARIA-RPS` defines the UI system and presentation constraints.
2. `DEV-RPS` implements deterministic logic that enforces the gameplay canon.
3. `QA-RPS` attacks the rules, verifies hidden information, and reports risks.
4. `DOCS-RPS` documents decisions, maintains README/ARCHITECTURE, and writes integration guides.
5. `CONTENT-RPS` authors all in-game strings, lore, and micro-copy aligned to current game state.
6. `ANALYST-RPS` validates force composition and anti-stalemate rules with explicit math.
7. Any mismatch between these layers must be treated as a synchronization issue.

---

## 6. Retired Guidance

The old Memory Game role prompts and project-local Codex skills were removed from the active workflow.

Any future role or skill added to the repo must align with the synchronized ARIA-RPS / DEV-RPS / QA-RPS system before it is documented here.
