# Sprint 01 - Task List

CTO creates tasks. DEV executes. QA verifies.

| # | Task | Owner | Complexity | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| 1 | Freeze Sprint 1 around the Squad RPS vertical slice and retire Memory Game assumptions in sprint docs | `[Architect]` | Small | [x] | Sprint goals, scope, and ownership all reference Squad RPS instead of Memory Game |
| 2 | Make the Python backend the authoritative source of truth for movement, attacks, duel outcomes, and hidden state | `[DEV:backend]` | Large | [ ] | all gameplay mutations happen server-side and the client only renders returned match state |
| 3 | Fix combat correctness, including `rock/paper/scissors` resolution and tie-repick behavior | `[DEV:backend]` | Large | [ ] | covered tests prove `rock` loses to `paper`, `paper` loses to `scissors`, `scissors` loses to `rock`, and repicks do not mutate canonical weapons |
| 4 | Fix movement correctness so pieces never swap positions or overwrite each other incorrectly | `[DEV:backend]` | Medium | [ ] | move requests only relocate the moving piece into a legal empty square and board state remains consistent after subsequent turns |
| 5 | Add authoritative backend event logging for reveal, moves, attacks, repicks, duel outcomes, and match end | `[DEV:backend]` | Medium | [ ] | each important state transition is visible in the returned match event log |
| 6 | Make legal moves and legal attacks explicit in the React board UI | `[DEV:frontend]` | Medium | [ ] | a selected piece clearly shows where it can move and which enemy pieces it can legally attack |
| 7 | Surface move and attack failures next to the board action that caused them | `[DEV:frontend]` | Small | [ ] | invalid interactions show nearby feedback without requiring the user to scan the page |
| 8 | Add a persistent debug log panel in the UI driven by backend event log entries | `[DEV:frontend]` | Small | [ ] | the player can see a readable turn-by-turn list of moves, attacks, winners, eliminations, and repicks |
| 9 | Improve duel readability so players can immediately tell attacker, defender, weapons, winner, tie state, and revealed role | `[UI/UX Lead]` | Medium | [ ] | first-time observers can explain the duel result without additional narration |
| 10 | Rewrite the UI kit to match Squad RPS interaction states instead of the old card game | `[UI/UX Lead]` | Medium | [ ] | `docs/ui/UI_KIT.md` documents board zones, reveal state, movement affordances, duel feedback, and accessibility rules for this app |
| 11 | Add regression tests for combat correctness, movement legality, dead-piece rendering safety, and debug-log visibility | `[QA Lead]` | Medium | [ ] | automated tests fail if a piece mutates weapons incorrectly, swaps illegally, or hidden-state presentation regresses |
| 12 | Add one reliable browser-level verification flow for reveal -> move -> duel -> result | `[QA Lead]` | Medium | [ ] | a browser test or reproducible manual checklist covers the main demo loop end to end |
| 13 | Run a demo-readiness pass against the live app and capture remaining blockers | `[QA Lead]` | Small | [ ] | remaining issues are listed by severity with exact reproduction steps |

---

## Dependency Order

1 -> 2 -> 3/4/5 -> 6/7/8 -> 9/10 -> 11 -> 12 -> 13

---

## Release Blockers

These items block a demo sign-off:
- task 2 incomplete
- task 3 incomplete
- task 4 incomplete
- task 6 incomplete
- task 8 incomplete
- task 11 incomplete
- task 12 incomplete
- any exposure of `ANTHROPIC_API_KEY`
- any case where hidden enemy state leaks illegally
- any case where a piece appears to move, swap, or fight contrary to the event log
