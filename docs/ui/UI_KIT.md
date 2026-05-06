# UI Kit — Squad RPS Design System
# Visual Reference: RPS Online (original Flash game)

Use this document as the source of truth for all UI tokens, component rules, and interaction design.

---

## 1. Visual Direction

**Reference game:** RPS Online (original Flash game)
The visual identity must match or closely echo the original:
- Checkerboard green board (alternating light/dark green squares)
- Warm olive/lime green for all backgrounds and surfaces
- Blue team (CPU) on top rows — samurai-style characters with blue topknot
- Red team (Player) on bottom rows — characters with red topknot
- Weapons displayed as small icons ON the character sprites
- Bold, chunky typography with yellow-green and red/blue player name labels
- Right sidebar with RPS logo (yellow-green gradient text), a referee character, and a Yin-Yang timer
- Characters are small sprite-style with expressive faces (not flat icons)

**Tone:** Arcade, fun, slightly retro. Not dark. Not corporate. Feels like a classic Flash game.

---

## 2. Color Tokens

### Primary Palette (match RPS Online)

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#6daa2c` | outer page background — warm lime green |
| `--color-board-light` | `#8dc63f` | board square — light checker cell |
| `--color-board-dark` | `#6daa2c` | board square — dark checker cell |
| `--color-board-border` | `#4a7a1e` | board outer border |
| `--color-surface` | `#5a9020` | panels and sidebar background |
| `--color-surface-raised` | `#4a7a1e` | elevated sidebar sections |

### Team Colors

| Token | Value | Usage |
|---|---|---|
| `--color-player` | `#cc2200` | Player (Red) team — units, name label, highlights |
| `--color-player-light` | `#ff4422` | Player unit hover / selected |
| `--color-cpu` | `#1a44cc` | CPU (Blue) team — units, name label, highlights |
| `--color-cpu-light` | `#3366ff` | CPU unit hover |

### Accent and UI

| Token | Value | Usage |
|---|---|---|
| `--color-flag` | `#ffcc00` | Flag unit indicator — gold |
| `--color-decoy` | `#b060d0` | Decoy unit indicator — purple |
| `--color-selected` | `#ffffff` | Selection ring / highlight on active unit |
| `--color-valid-target` | `#ffff44` | Highlight on valid attack targets |
| `--color-danger` | `#cc0000` | Loss state, error messages |
| `--color-success` | `#44bb44` | Win state |
| `--color-warning` | `#ffaa00` | Tie repick prompt |
| `--color-timer-bg` | `#3a6010` | Timer circle background |
| `--color-timer-fill` | `#aaee22` | Timer circle fill |

### Text

| Token | Value | Usage |
|---|---|---|
| `--color-text` | `#ffffff` | Primary UI text |
| `--color-text-muted` | `#ddeeaa` | Secondary labels and helper text |
| `--color-label-player` | `#ff4422` | Player name label (red, bold) |
| `--color-label-cpu` | `#2255ff` | CPU name label (blue, bold) |
| `--color-logo-text` | `#ccee22` | RPS logo text (yellow-green gradient) |

---

## 3. Typography

| Token | Value | Usage |
|---|---|---|
| `--font-heading` | `"Impact", "Arial Black", sans-serif` | RPS logo, win/loss screen titles |
| `--font-body` | `"Arial Rounded MT Bold", "Arial", sans-serif` | Player names, labels, button text |
| `--font-ui` | `"Verdana", "Geneva", sans-serif` | Phase messages, stats, tooltips |
| `--font-mono` | `"Courier New", monospace` | Timer countdown |

**Text sizes:**
- Logo title: `48px`, bold, yellow-green with dark outline
- Player name labels: `20px`, bold, in team color
- Phase messages: `16px`
- Stat values: `14px`

---

## 4. Spacing and Sizing

| Token | Value | Usage |
|---|---|---|
| `--cell-size` | `82px` | Board grid cell size (desktop) |
| `--unit-size` | `70px` | Character sprite within cell |
| `--board-gap` | `0px` | No gap between cells (flush grid) |
| `--sidebar-width` | `220px` | Right sidebar width |
| `--space-xs` | `6px` | Tight padding |
| `--space-md` | `14px` | Standard padding |
| `--space-lg` | `24px` | Section separation |
| `--radius-sm` | `6px` | Button and badge radius |
| `--radius-md` | `12px` | Panel radius |

---

## 5. Board Layout

```
┌─────────────────────────────┬──────────────┐
│ [CPU Name — Blue]           │  RPS LOGO    │
│ ┌───────────────────────┐   │  (sidebar)   │
│ │ CPU  CPU  CPU  CPU  CPU  CPU  CPU │   │              │
│ │ CPU  CPU  CPU  CPU  CPU  CPU  CPU │   │ [Referee     │
│ │ ·    ·    ·    ·   ·  │   │  character]  │
│ │ ·    ·    ·    ·   ·  │   │              │
│ │ P1   P1   P1   P1   P1   P1   P1 │   │ [Timer /     │
│ │ P1   P1   P1   P1   P1   P1   P1 │   │  Yin-Yang]   │
│ └───────────────────────┘   │              │
│ [Player Name — Red]         │  [? button]  │
└─────────────────────────────┴──────────────┘
```

- 7 columns × 6 rows
- Rows 6–5: CPU (Blue) squad
- Rows 4–3: Neutral battle zone (empty)
- Rows 2–1: Player (Red) squad
- Checker pattern: alternating `--color-board-light` / `--color-board-dark`
- Board border: 4px solid `--color-board-border` with subtle drop shadow

---

## 6. Component Specs

### BoardCell

States:
| State | Visual |
|---|---|
| `empty` | Checker square, no content |
| `playerUnit` | Red character sprite with weapon icon overlay |
| `cpuHidden` | Blue character sprite, no weapon shown (back turned or blank face) |
| `cpuRevealed` | Blue character sprite with weapon icon — during duel or match end |
| `selected` | White ring/glow around cell, slight scale-up (1.1×) |
| `validTarget` | Yellow border pulse on cell |
| `blocked` | Greyed out, no interaction |

### Unit Sprite

- Player units: red-toned character, small weapon icon in bottom-right corner
- CPU units: blue-toned character, weapon hidden unless revealed
- Flag unit: gold crown/badge on top of character
- Decoy unit: purple diamond badge (only visible to owning player)
- Dead unit: disappears with a brief shrink animation

### Sidebar

Sections from top to bottom:
1. **RPS Logo** — "RPS" in large yellow-green italic text + "Online" below in white
2. **Referee character** — small decorative sprite (samurai referee)
3. **Timer / Yin-Yang circle** — animated countdown, Yin-Yang symbol when idle
4. **Help button** — `?` button at bottom

### Player Name Labels

- CPU name: displayed above board, bold, `--color-label-cpu`
- Player name: displayed below board, bold, `--color-label-player`

### Weapon Icons (on units)

| Weapon | Icon |
|---|---|
| Rock | 🪨 or a grey stone sprite |
| Paper | 📄 or a scroll/paper sprite |
| Scissors | ✂️ or a golden scissors sprite |

### Duel Overlay

When a duel triggers:
1. Two characters animate toward the center of the board
2. Weapons shown large in the center (Paper / Rock / Scissors icons, ~80px)
3. Result flashes: winner highlighted in green, loser fades out
4. Returns to board state after ~1s

### Game Over Screen

- Full-board dark overlay
- Large text: "YOU WIN!" (green) or "YOU LOSE!" (red) in Impact/bold
- All hidden weapons and roles revealed on the board
- Stats below: duration, duels won, duels lost, ties, Decoy absorptions
- "Play Again" button — chunky, arcade style

---

## 7. Motion

| Motion | Duration | Notes |
|---|---|---|
| Weapon hide (Phase 1→2) | `600ms` | Characters "turn around" or bring weapon behind back |
| Duel animation | `1000ms` | Characters slide to center, weapons enlarge |
| Unit death | `300ms` | Shrink + fade out |
| Selected highlight | `150ms` | Ring appears instantly, slight pulse |
| Valid target pulse | `400ms` loop | Yellow border pulses while attacker is selected |
| Sidebar timer | per second | Countdown number ticks down |

---

## 8. Required UI Sequence

Before any screen is built, ARIA-RPS must complete all four steps in order:

1. **Step 1 → Tokens** — colors, typography, spacing confirmed
2. **Step 2 → Components** — all board cells, units, sidebar elements defined
3. **Step 3 → State Map** — what is visible/clickable in each game phase
4. **Step 4 → UI** — actual screen implementation

Skipping any step makes the output invalid.

---

## 9. Accessibility Rules

- All board cells must be keyboard-reachable (tab order: left to right, top to bottom)
- Units must expose state via `aria-label` (e.g., "Your Scissors unit, row 2 column 3")
- Selected and valid-target states must have visible non-color indicators (ring, border)
- Contrast ratios must pass WCAG AA for all text on game backgrounds
