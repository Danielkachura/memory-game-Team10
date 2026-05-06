# Game Module

Core Squad RPS gameplay module.
- Board management (5x6)
- Duel engine (RPS resolution)
- Hidden-info state mapping
- Turn orchestration (Reveal -> Player -> AI)


## Owns
- game state transitions
- card matching rules
- board rendering
- timer, scoring, and win-state behavior

## Planned Structure
- `src/components/` for `GameBoard`, `Card`, `ScorePanel`, `Timer`, `WinScreen`, `GameSetup`
- `src/hooks/` for `useGame`, `useTimer`, `useScore`
- `src/utils/` for `shuffle`, `matchCheck`, `scoreCalculator`
- `tests/unit/` for pure logic
- `tests/integration/` for gameplay flows
