---
name: memory-game-review
description: Review code changes in the Memory Game - Team 10 repository. Use when asked to review, audit, or inspect changes for bugs, regressions, risky architecture drift, missing tests, secret exposure, or gameplay-rule violations in this codebase.
---

# Memory Game Review

Read `AGENTS.md`, `CLAUDE.md`, and `docs/ARCHITECTURE.md` first.

Focus on findings, not summaries.

## Review Priorities

1. Correctness of gameplay state transitions
2. Regressions in canonical shared rules
3. Claude proxy trust-boundary and secret-handling mistakes
4. Missing or weak tests
5. UI-flow regressions covered by Playwright or not covered when they should be

## Required Checks

- Confirm no frontend secret exposure
- Confirm difficulty/grid/pair counts still match spec
- Confirm no path allows more than two unresolved flipped cards
- Confirm AI failures still degrade gracefully
- Confirm tests cover the changed behavior or explicitly note the gap

## Output Shape

List findings first with:
- severity
- file path
- concrete behavior or risk

Keep any summary short and secondary.

## Reference Files

- `references/review-hotspots.md`

