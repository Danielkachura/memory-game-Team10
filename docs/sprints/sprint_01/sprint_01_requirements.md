# Sprint 01 — Requirements

## Board

- 7 columns × 6 rows = 42 squares
- Player (Red): rows 1–2, cols 1–7 → 14 pieces
- CPU (Blue): rows 5–6, cols 1–7 → 14 pieces
- Neutral: rows 3–4 — empty

## Component Architecture

```
GameScreen
├── PlayerNameLabel (cpu, above)
├── GameBoard (7×6 grid)
│   └── BoardCell ×42
│       └── UnitSprite (×28 when occupied)
├── PlayerNameLabel (player, below)
└── Sidebar (RPS logo + Yin-Yang)
```

## Data

```typescript
BOARD_COLS = 7
BOARD_ROWS = 6
UNITS_PER_SQUAD = 14

Piece { id, owner, row: 1–6, col: 1–7 }
buildInitialPieces() → 28 pieces
```

## CSS

```css
--cell-size: 72px
--sidebar-width: 210px
--color-board-light: #8dc63f
--color-board-dark:  #6daa2c
--color-player: #cc2200
--color-cpu:    #1a44cc
```

## No API Calls in Sprint 01
