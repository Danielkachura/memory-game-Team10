# UI Kit - Squad RPS

Use this document as the source of truth for UI tokens, board-state readability, and interaction rules for the Squad RPS frontend.

---

## 1. Visual Direction

The product should feel:
- tactical
- readable under time pressure
- polished enough for demo judging
- game-like without becoming noisy

Theme direction:
- deep night-sky background
- cool player-side tones and warmer enemy-side tones
- strong board contrast
- restrained motion that clarifies gameplay state

Primary principle:
- the board is the product
- decorative styling must never reduce action clarity

---

## 2. Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#07111d` | page background |
| `--color-bg-accent` | `#132945` | gradient depth and large surfaces |
| `--color-surface` | `rgba(14, 24, 38, 0.88)` | panels and HUD cards |
| `--color-surface-raised` | `rgba(23, 40, 62, 0.96)` | active cards, setup controls |
| `--color-border` | `rgba(255, 255, 255, 0.12)` | panel and board borders |
| `--color-primary` | `#7dd3fc` | primary interaction accent |
| `--color-primary-strong` | `#38bdf8` | hover and active emphasis |
| `--color-secondary` | `#fde68a` | selected piece highlight |
| `--color-success` | `#86efac` | successful outcomes |
| `--color-warning` | `#fdba74` | cautionary state and ties |
| `--color-danger` | `#fb7185` | errors and failure outcomes |
| `--color-text` | `#f8fafc` | primary text |
| `--color-text-muted` | `#94a3b8` | helper text and board annotations |

Rules:
- reusable UI should reference tokens, not ad-hoc colors
- enemy-hidden state should read as distinct, not disabled
- danger styling should be reserved for actual failure or blocking state

---

## 3. Typography

| Token | Value | Usage |
|---|---|---|
| `--font-heading` | `"Space Grotesk", "Trebuchet MS", sans-serif` | app title, panel headings |
| `--font-body` | `"Manrope", "Segoe UI", sans-serif` | standard UI text |

Scale:

| Level | Size | Weight | Usage |
|---|---|---|---|
| `display` | `clamp(2.6rem, 7vw, 4.8rem)` | 700 | setup hero title |
| `h1` | `clamp(2rem, 4vw, 3rem)` | 700 | main game heading |
| `h2` | `1.35rem` | 700 | panel headings |
| `body` | `1rem` | 500 | standard UI copy |
| `small` | `0.875rem` | 500 | helper text |
| `micro` | `0.72rem` | 600 | coordinates, debug labels |

Rules:
- headings should stay compact and game-facing
- coordinate and HUD metadata should remain readable on laptop screens

---

## 4. Spacing And Radius

| Token | Value |
|---|---|
| `--space-2xs` | `4px` |
| `--space-xs` | `8px` |
| `--space-sm` | `12px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |
| `--space-2xl` | `48px` |
| `--radius-sm` | `10px` |
| `--radius-md` | `18px` |
| `--radius-lg` | `24px` |

---

## 5. Board Layout Rules

Board model:
- 5 columns x 6 rows
- rows 1-2: player territory
- rows 3-4: neutral battle zone
- rows 5-6: enemy territory

Layout rules:
- board cells must stay large enough to show piece label plus icon
- coordinates should remain visible for debugging and QA
- the board legend must explain row zones without competing with gameplay
- HUD and side panels must not squeeze the board below readable size on a laptop

Responsive rules:
- on narrower screens, stack HUD above gameplay
- preserve legal-action visibility before preserving decorative spacing
- debug log can scroll internally instead of stretching the layout

---

## 6. Core Components

### Setup Screen

Requirements:
- one obvious primary action: `Start Match`
- difficulty options visible without extra navigation
- short, fast explanation of the game loop

### HUD Cards

Required cards:
- phase
- turn
- stats

Rules:
- current turn must read instantly
- reveal timer must be prominent during reveal
- stats are secondary to phase and turn clarity

### Board Cells

States:

| State | Treatment | Notes |
|---|---|---|
| Player piece | cool blue surface | weapon and role info visible to player |
| Enemy hidden piece | warm dark surface | silhouette visible, hidden info preserved |
| Selected piece | secondary border + glow | cannot be subtle |
| Empty illegal cell | subdued dashed state | should not look actionable |
| Empty legal move cell | primary-tinted highlight | must clearly read as actionable |
| Defeated piece | removed from occupied-cell rendering | never overwrite live piece display |

Rules:
- player and enemy cells must be distinguishable without relying only on text
- selected, movable, and attackable states must not be confused with each other

### Command Brief

Rules:
- copy changes by phase
- explain exactly what the player can do next
- blocked-piece explanation must be short and local to the interaction

### Duel Panel

Must show:
- attacker
- defender
- both weapons shown in that duel
- winner or tie
- decoy absorb behavior
- revealed role on elimination

### Debug Log

Must show:
- newest events first
- compact event labels
- readable move and duel tracing
- enough detail to debug live board behavior during a demo

---

## 7. Interaction States

### Reveal

Rules:
- board is locked
- all weapons visible
- countdown obvious
- transition into hidden-info state must be unmistakable

### Player Turn

Rules:
- selecting a friendly piece highlights legal move targets
- legal adjacent attacks must be distinguishable from non-adjacent enemy pieces
- illegal actions must show nearby error feedback

### AI Turn

Rules:
- clearly communicate `Claude thinking`
- player cannot accidentally queue conflicting actions
- when AI finishes, board state updates must feel immediate and trustworthy

### Repick

Rules:
- tie state must be prominent
- repick controls must feel like a forced decision, not optional flavor

### Finished

Rules:
- result first
- reason second
- stats third
- restart action obvious

---

## 8. Motion

| Motion | Duration | Notes |
|---|---|---|
| Panel reveal | `250-300ms` | subtle fade and lift |
| Selection emphasis | `150-180ms` | border and glow response |
| Legal-target emphasis | `150-180ms` | clear but restrained |
| Reveal countdown transition | `250-400ms` | should signal phase change |
| Duel update | `250-400ms` | clarify outcome, not cinematic overload |

Rules:
- motion exists to explain state change
- avoid continuous idle motion on the board
- honor `prefers-reduced-motion: reduce`

---

## 9. Accessibility Rules

- all critical controls must be keyboard reachable
- piece and empty-cell buttons must have meaningful `aria-label` values
- state cannot be communicated by color alone
- focus states must remain visible on board cells and side controls
- error messages should appear near the relevant interaction
- hidden enemy state must still be understandable to screen-reader users without leaking forbidden information

---

## 10. Copy Guidelines

- keep button labels short and literal
- prefer action language over flavor text during gameplay
- illegal-state messages should explain why the action failed
- AI fallback or degraded behavior should be honest and brief
- duel summaries should read as outcomes, not lore

Examples:
- `Move Here`
- `Your turn`
- `Claude thinking`
- `You can only duel an adjacent enemy`
- `Tie. Pick a new weapon to continue`

---

## 11. Sprint 1 Quality Bar

Sprint 1 UI work is not done unless:
- movement is visually understandable
- attack legality is visually understandable
- reveal phase is readable
- duel outcomes are understandable without explanation
- the debug log traces gameplay clearly
- the board still reads well on a normal laptop viewport

The frontend should optimize for demo trust: when something happens on the board, the player should understand why.
