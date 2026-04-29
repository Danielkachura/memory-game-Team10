# Sprint 01 - Squad RPS Stabilization And Demo Flow

| Field | Value |
|---|---|
| Sprint | 01 |
| Goal | Ship a stable Squad RPS vertical slice with correct combat, readable movement and duel UX, and demo-safe observability |
| Status | In Progress |
| Start | 2026-04-29 |
| End | Hackathon end date |
| CTO Owner | `[CTO]` |

---

## Sprint Objectives

1. Stabilize the authoritative Python game engine
2. Eliminate combat and board-state drift bugs
3. Make movement, attack, reveal, and duel states readable in the React UI
4. Add debug visibility so live gameplay bugs can be traced quickly during demo prep
5. Expand automated coverage around combat correctness, movement legality, and hidden-info behavior

---

## Owner Map

| Area | Role Owner |
|---|---|
| System structure and interfaces | `[Architect]` |
| UI/gameplay implementation plan | `[Tech Lead:frontend]` |
| Game engine and API implementation plan | `[Tech Lead:backend]` |
| UX clarity and demo-facing interaction quality | `[UI/UX Lead]` |
| Quality gates and release sign-off | `[QA Lead]` |
| Hidden-state and token exposure review | `[Security Reviewer]` |

---

## Scope

In scope:
- Python backend as authoritative match engine
- React board flow for reveal, movement, attack, duel, tie repick, and restart
- correct RPS combat resolution and role handling
- movement legality and adjacency enforcement
- debug event log visible in the app
- AI turn safety and fallback behavior
- unit and integration tests for high-risk gameplay rules
- demo-safe UX polish for the main gameplay loop

Out of scope:
- accounts
- persistence
- production multiplayer polish
- mobile app packaging
- theme systems unrelated to gameplay
- nonessential visual redesign

---

## Exit Criteria

- a full Squad RPS match can be played from reveal to result without rule-breaking bugs
- `rock`, `paper`, and `scissors` resolve correctly in all covered cases
- movement never swaps pieces or overwrites board state incorrectly
- hidden enemy information stays hidden outside legal reveal moments
- the app exposes a readable debug log of moves and duels
- backend and frontend tests cover the highest-risk gameplay paths
- no browser-exposed API key or leaked hidden-state authority

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Combat state mutates incorrectly across turns | High | High | add backend rule tests and event logging |
| Board UI misrepresents legal actions | High | High | UI/UX-led interaction review and focused frontend tests |
| AI turn hides or overwrites player-observed state | Medium | High | keep backend authoritative and verify projections |
| Old Memory Game docs continue to misdirect implementation | High | Medium | rewrite sprint and UI ownership docs first |
| Overbuilding beyond demo-ready scope | High | High | keep Sprint 1 limited to stable vertical-slice gameplay |

---

## Deliverables

- Sprint 1 task list aligned to Squad RPS
- stable combat and movement rule set
- debug-log-supported gameplay loop
- frontend interaction clarity pass for movement and attacks
- regression coverage for combat, movement, and hidden-state safety

---

## Execution Plan

1. Backend stabilizes canonical combat and movement behavior first.
2. Frontend makes legal actions explicit and surfaces nearby failure feedback.
3. UI/UX Lead validates board readability and duel comprehension.
4. QA verifies rule correctness and demo safety with regression coverage.

This sprint is successful when the team can demo the match loop without manually explaining or apologizing for the rules.
