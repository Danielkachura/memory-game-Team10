# Game Rules

## Difficulty and Pair Counts

- `easy`: `4 x 3`, `6` pairs
- `medium`: `4 x 4`, `8` pairs
- `hard`: `6 x 4`, `12` pairs

## Canonical Types

- `Difficulty = "easy" | "medium" | "hard"`
- `Theme = "animals" | "flags" | "space" | "custom-ai"`
- `GameStatus = "idle" | "playing" | "paused" | "won"`

## Core Loop

1. Start from setup.
2. Build and shuffle the deck for the chosen difficulty and theme.
3. Allow only one or two active flipped cards at a time.
4. When two cards are flipped:
   - increment moves
   - resolve match or mismatch
5. On mismatch, flip both cards back after about one second.
6. On win, show moves, elapsed time, and star rating.

## Score Thresholds

- `easy`: `3` stars at `<=12` moves, `2` stars at `<=18`, else `1`
- `medium`: `3` stars at `<=20` moves, `2` stars at `<=30`, else `1`
- `hard`: `3` stars at `<=35` moves, `2` stars at `<=50`, else `1`

## Claude Feature Rules

- Theme generation runs only when starting a `custom-ai` game.
- Hint generation runs only on explicit hint request.
- End-game narration runs only when the board is completed.
- Claude failures must leave the game playable.
- Timeout budget is `8` seconds.

