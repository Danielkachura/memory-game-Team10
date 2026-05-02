# Squad RPS | Claude Code Project Context

---

## Shared Canon

- board: `7×6` (7 columns × 6 rows — 42 squares)
- teams: 14 per side — Player (Red) rows 1–2, CPU (Blue) rows 5–6
- neutral: rows 3–4
- unit types: `rock`, `paper`, `scissors`, `flag`, `decoy`
- NO AI API — CPU = local logic only

## Active Commands

| Command | Purpose |
|---|---|
| `/project:cto` | CTO / ARIA-RPS — UI system + architecture |
| `/project:dev-rps` | DEV — game logic + CPU + tests |
| `/project:qa-rps` | QA — rules + hidden-info + sign-off |
| `/project:docs-rps` | DOCS — architecture + decisions |
| `/project:content-rps` | CONTENT — copy + unit names |
| `/project:analyst-rps` | ANALYST — balance + difficulty |
| `/project:plan` | Force plan mode |
| `/project:test` | Run unit tests |
| `/project:e2e` | Run Playwright |

## Sprint Plan

| Sprint | Scope |
|---|---|
| **01** | 7×6 board, pieces, click-to-select |
| **02** | Weapons + Reveal phase |
| **03** | Roles + Duel Engine |
| **04** | CPU Easy + game loop |
| **05** | CPU Medium+Hard + polish |

## Key Files

| File | Purpose |
|---|---|
| `docs/PRD.md` | Product requirements |
| `docs/ARCHITECTURE.md` | Technical design |
| `docs/ui/UI_KIT.md` | Visual tokens — RPS Online style |
| `docs/DECISIONS.md` | Decision log |
| `AGENTS.md` | Agent roles + canon |
