# Agent Constitution — Squad RPS

> This file defines the active roles, canon, workflow, and visual identity for this project.

---

## Prime Directive

Claude is your development partner. The founder is the final decision maker.

**No AI/LLM API is used in this project.** The computer opponent is local logic only.

All agents must follow the sprint plan in the PRD — one sprint at a time, in order.

---

## Visual Identity

**Reference game:** RPS Online (original Flash game)

- Green checkerboard board (`#8dc63f` / `#6daa2c`) with dark border
- CPU (Blue) team on top rows — name label in blue above the board
- Player (Red) team on bottom rows — name label in red below the board
- Olive green right sidebar: RPS logo, Yin-Yang timer, `?` button
- Arcade typography (Impact / Arial Rounded Bold)
- Weapon icons as small sprites on characters

Full spec: `docs/ui/UI_KIT.md`

---

## Shared Game Canon

- **Board:** 7 columns × 6 rows (7×6 = 42 squares)
- **Teams:** 14 pieces per side — Player (Red) rows 1–2, CPU (Blue) rows 5–6, rows 3–4 neutral
- **Unit types:** `rock`, `paper`, `scissors`, `flag`, `decoy`
- **Owners:** `player`, `cpu`
- **Movement:** None for MVP — direct attack selection
- **Weapon distribution:** balanced across 14 units per squad
- **Battle reveal:** both units reveal during duel; winner's weapon hides again; loser removed
- **Win:** enemy `flag` eliminated → instant win; own `flag` eliminated → instant loss
- **Decoy:** invulnerable; becomes killable if last enemy unit alive
- **Tie:** both re-pick; soft cap 5 ties → forced random
- **Role assignment:** 1 Flag + 1 Decoy per squad, randomly after 10s reveal
- **CPU opponent:** local logic only — no AI API

```
Row 6 │ CPU  CPU  CPU  CPU  CPU  CPU  CPU
Row 5 │ CPU  CPU  CPU  CPU  CPU  CPU  CPU
Row 4 │ ·    ·    ·    ·    ·    ·    ·    ← neutral
Row 3 │ ·    ·    ·    ·    ·    ·    ·    ← neutral
Row 2 │ P1   P1   P1   P1   P1   P1   P1
Row 1 │ P1   P1   P1   P1   P1   P1   P1
        C1   C2   C3   C4   C5   C6   C7
```

Canonical phases: `reveal` → `player_turn` ↔ `cpu_turn` (↔ `repick`) → `finished`

CPU difficulty: `easy` = random | `medium` = memory | `hard` = memory + Flag hunt

---

## Sprint Order

| Sprint | Scope |
|---|---|
| **01** | 7×6 board, 14 red pieces rows 1–2, 14 blue pieces rows 5–6, click-to-select |
| **02** | Weapon icons + 10s Reveal phase |
| **03** | Flag & Decoy + full Duel Engine |
| **04** | CPU opponent Easy + full game loop |
| **05** | CPU Medium + Hard, stats, Polish |

---

## Active Roles

| Role | Command | Owns |
|---|---|---|
| **[CTO] ARIA-RPS** | `/project:cto` | Visual identity, UI system, architecture, sprint planning |
| **[DEV-RPS]** | `/project:dev-rps` | Game logic, CPU opponent, tests |
| **[QA-RPS]** | `/project:qa-rps` | Rule validation, hidden-info, sprint sign-off |
| **[DOCS-RPS]** | `/project:docs-rps` | README, ARCHITECTURE, DECISIONS, sprint docs |
| **[CONTENT-RPS]** | `/project:content-rps` | Unit names, battle strings, micro-copy |
| **[ANALYST-RPS]** | `/project:analyst-rps` | Weapon balance, CPU difficulty curves |

---

## Mandatory UI Sequence

1. Step 1 → Tokens
2. Step 2 → Components
3. Step 3 → State Map
4. Step 4 → UI
