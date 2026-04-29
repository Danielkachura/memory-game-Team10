# UI Kit - Memory Game Design System

Use this document as the source of truth for UI tokens and interaction rules.

---

## 1. Visual Direction

The product should feel:
- playful
- polished enough for demo judging
- readable under time pressure
- slightly arcade-like without becoming noisy

Theme direction:
- deep night-sky background
- bright card faces and accent colors
- clear match and mismatch feedback

---

## 2. Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#09111f` | page background |
| `--color-bg-accent` | `#12233f` | gradient depth and large surfaces |
| `--color-surface` | `#132033` | cards, panels, modal surfaces |
| `--color-surface-raised` | `#1d2d45` | elevated card faces, controls |
| `--color-primary` | `#4ecdc4` | primary actions, focus accents |
| `--color-primary-strong` | `#14b8a6` | hover and active states |
| `--color-secondary` | `#ffd166` | stars, celebratory highlights |
| `--color-success` | `#7bd389` | matched state and success banners |
| `--color-warning` | `#ffb703` | cautionary messaging |
| `--color-danger` | `#ef476f` | API errors and mismatch feedback |
| `--color-text` | `#f8fbff` | primary text |
| `--color-text-muted` | `#a7b7cc` | secondary labels and helper copy |
| `--color-card-back` | `#4ecdc4` | face-down cards |
| `--color-card-face` | `#17304d` | face-up cards |

Rules:
- never hardcode hex values inside reusable components
- expose tokens as CSS variables near the app root
- use `--color-danger` sparingly so actual failures remain obvious

---

## 3. Typography

| Token | Value | Usage |
|---|---|---|
| `--font-heading` | `"Space Grotesk", "Trebuchet MS", sans-serif` | title, modal headings |
| `--font-body` | `"Manrope", "Segoe UI", sans-serif` | UI text |
| `--font-emoji` | `"Apple Color Emoji", "Segoe UI Emoji", sans-serif` | emoji card content |
| `--font-mono` | `"JetBrains Mono", "Consolas", monospace` | timer, dev/debug labels if shown |

Scale:

| Level | Size | Weight | Usage |
|---|---|---|---|
| `display` | `clamp(2.25rem, 5vw, 4rem)` | 700 | app title |
| `h1` | `2rem` | 700 | win screen title |
| `h2` | `1.5rem` | 700 | panel headings |
| `body` | `1rem` | 500 | standard UI copy |
| `small` | `0.875rem` | 500 | helper text, hints |
| `card` | `2rem` | 600 | card face content |

---

## 4. Spacing and Radius

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
| `--radius-md` | `16px` |
| `--radius-lg` | `24px` |

---

## 5. Board Layout Rules

| Difficulty | Grid | Card Size | Gap |
|---|---|---|---|
| `easy` | `4 x 3` | `100px` | `12px` |
| `medium` | `4 x 4` | `90px` | `10px` |
| `hard` | `6 x 4` | `80px` | `8px` |

Responsive rules:
- on narrow screens, allow the board to scale down without horizontal overflow
- preserve tap targets at a usable size
- keep setup controls above the board on mobile

---

## 6. Components

### Cards
States:

| State | Background | Border | Notes |
|---|---|---|---|
| Face-down | `--color-card-back` | none | content hidden |
| Face-up | `--color-card-face` | `1px solid --color-surface-raised` | content visible |
| Matched | `--color-card-face` | `2px solid --color-success` | subtle glow |
| Mismatch | `--color-card-face` | `1px solid --color-danger` | brief feedback before flip-back |

Rules:
- use a 3D flip only if reduced motion is respected
- matched cards must remain readable, not dimmed
- disabled cards must still look intentional, not broken

### Buttons

| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | `--color-primary` | `#06202a` | none |
| Secondary | transparent | `--color-text` | `1px solid --color-primary` |
| Tertiary | `--color-surface-raised` | `--color-text` | none |
| Danger | `--color-danger` | white | none |

### Panels
- background: `--color-surface`
- border: `1px solid rgba(255,255,255,0.08)`
- radius: `--radius-md`
- padding: `--space-lg`

### Win Screen
- should feel celebratory but not block readability
- highlight stars and final stats first
- recap text is secondary to score clarity

---

## 7. Motion

| Motion | Duration | Notes |
|---|---|---|
| Card flip | `300ms` | ease-in-out |
| Match pulse | `450ms` | subtle scale and glow |
| Mismatch shake | `350ms` | horizontal shake before reset |
| Panel reveal | `300ms` | fade and slight upward motion |
| Win screen reveal | `400ms` | stronger than panel reveal |

Rules:
- honor `prefers-reduced-motion: reduce`
- avoid constant idle animations
- motion should clarify state changes, not decorate every element

---

## 8. Accessibility Rules

- all cards must be keyboard reachable
- cards must expose state through `aria-label`
- matched cards should be non-interactive and announce as matched
- hint and new-game controls need visible focus states
- color is not the only indicator of match or error state
- modal or win screen should move focus when opened

---

## 9. Copy Guidelines

- keep button labels short: `New Game`, `Hint`, `Play Again`
- use encouraging copy, not overly childish copy
- AI fallback messages should be honest and brief
- avoid technical error jargon in player-facing UI
