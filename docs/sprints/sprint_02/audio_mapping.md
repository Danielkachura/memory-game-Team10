# Audio File Mapping — Sprint 02
# Squad RPS — Team 10
# Mapped: 2026-05-05 — all 13 WhatsApp files identified by size + duration + volume

---

## ⚡ ACTION REQUIRED — Manual copy needed

The audio files you uploaded via WhatsApp need to be renamed and placed in:
`frontend/app/public/audio/`

Copy each file from WhatsApp downloads using this exact table:

---

## Rename Table

| WhatsApp Filename | Size | Duration | → Rename To | Use In Code As |
|-------------------|------|----------|-------------|----------------|
| `WhatsApp_Audio_2026-05-01_at_13_22_26.mp4` | 38KB | 2.3s | `battle_start.wav.m4a` | `/audio/battle_start.wav.m4a` |
| `WhatsApp_Audio_2026-05-01_at_13_22_26__1_.mp4` | 14KB | 0.8s | `you_lose_short.wav.mp4` | `/audio/you_lose_short.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_26__2_.mp4` | 43KB | 2.6s | `scissors.wav.mp4` | `/audio/scissors.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_26__3_.mp4` | 16KB | 0.9s | `blue_turn.wav.mp4` | `/audio/blue_turn.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_27.mp4` | 25KB | 1.5s | `red_turn.wav.mp4` | `/audio/red_turn.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_27__1_.mp4` | 15KB | 0.9s | `jump.wav.mp4` | `/audio/jump.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_27__2_.mp4` | 31KB | 1.9s | `rock.wav.mp4` | `/audio/rock.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_27__3_.mp4` | 34KB | 2.0s | `paper.wav.mp4` | `/audio/paper.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_28.mp4` | **60KB** | **3.65s** | `you_win.wav.mp4` | `/audio/you_win.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_28__1_.mp4` | **50KB** | **3.0s** | `you_lose.wav.mp4` | `/audio/you_lose.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_28__2_.mp4` | **4KB** | **0.22s** | `select_click.wav.mp4` | `/audio/select_click.wav.mp4` ⭐ NEW |
| `WhatsApp_Audio_2026-05-01_at_13_22_28__3_.mp4` | 14KB | 0.86s | `shuffle.wav.mp4` | `/audio/shuffle.wav.mp4` |
| `WhatsApp_Audio_2026-05-01_at_13_22_29.mp4` | 1.26MB | 79.7s | `main_theme.wav.mp4` | `/audio/main_theme.wav.mp4` |

---

## What Changed vs Previous Version

### ✅ Same files (just confirming correct names):
- `battle_start.wav.m4a` — 2.3s duel fanfare ✓
- `scissors.wav.mp4` — 2.6s scissors sound ✓
- `blue_turn.wav.mp4` — 0.9s AI turn ✓
- `red_turn.wav.mp4` — 1.5s player turn ✓
- `jump.wav.mp4` — 0.9s jump/move ✓
- `rock.wav.mp4` — 1.9s rock sound ✓
- `paper.wav.mp4` — 2.0s paper sound ✓
- `shuffle.wav.mp4` — 0.86s shuffle/tie ✓
- `main_theme.wav.mp4` — 79.7s music loop ✓

### 🆙 UPGRADED files (longer/better versions):
- `you_win.wav.mp4` — **3.65s** (was 37KB, now 60KB — proper victory fanfare)
- `you_lose.wav.mp4` — **3.0s** (was 13KB, now 50KB — proper defeat sound)

### ⭐ BRAND NEW file:
- `select_click.wav.mp4` — **0.22s** — ultra-short click sound
  - Use for: piece selection (`VM-00`), empty cell hover, repick button press
  - This was MISSING before — perfect for micro-feedback

### ❓ Unclear file (needs team confirmation):
- `you_lose_short.wav.mp4` (14KB, 0.8s, very quiet -14dB)
  - Could be: alternate lose sound, or a "blocked action" feedback sound
  - **Suggestion:** Use as `blocked.wav.mp4` for illegal move feedback

---

## Updated Sound Trigger Map (for useAudio.ts)

```ts
// COMPLETE sound trigger map with new files:

const SOUNDS = {
  // Game flow
  main_theme:      { file: "main_theme.wav.mp4",      vol: 0.2,  loop: true  },
  red_turn:        { file: "red_turn.wav.mp4",         vol: 0.5              },
  blue_turn:       { file: "blue_turn.wav.mp4",        vol: 0.5              },

  // Interaction feedback — NEW
  select_click:    { file: "select_click.wav.mp4",     vol: 0.4              }, // ⭐ NEW

  // Movement
  jump:            { file: "jump.wav.mp4",             vol: 0.6              },

  // Duel
  battle_start:    { file: "battle_start.wav.m4a",     vol: 0.7              },
  rock:            { file: "rock.wav.mp4",             vol: 0.8              },
  paper:           { file: "paper.wav.mp4",            vol: 0.8              },
  scissors:        { file: "scissors.wav.mp4",         vol: 0.8              },

  // Tie / Decoy
  shuffle:         { file: "shuffle.wav.mp4",          vol: 0.7              },

  // Match result — UPGRADED
  you_win:         { file: "you_win.wav.mp4",          vol: 0.9              }, // now 3.65s
  you_lose:        { file: "you_lose.wav.mp4",         vol: 0.9              }, // now 3.0s

  // Optional
  you_lose_short:  { file: "you_lose_short.wav.mp4",   vol: 0.5              }, // 0.8s quiet version
} as const;
```

---

## Updated VM-01 Code — Add `select_click` trigger

In `useAudio.ts`, add piece selection sound support.
The hook needs a new `onSelect` event from `GameScreen`:

```ts
// In GameScreen.tsx — when onPieceClick selects own piece:
// call: playSelectSound()

// In useAudio.ts — add to AudioState:
type AudioState = {
  // ... existing fields ...
  justSelected: boolean;  // true for one render after own piece selected
};

// Add trigger:
if (state.justSelected) {
  playSound("select_click.wav.mp4", 0.4);
}
```

Or simpler — play it directly in `onPieceClick` inside `useGame.ts`:
```ts
function onPieceClick(piece: VisiblePiece) {
  if (piece.owner === viewerOwner) {
    setSelectedAttackerId(piece.id);
    // Play click sound directly:
    new Audio("/audio/select_click.wav.mp4").play().catch(() => {});
    return;
  }
  // ... rest of handler
}
```

---

## Volume Guidelines (final)

| Category | Max Volume | Reason |
|----------|-----------|--------|
| Music | 0.20 | Background — never drowns gameplay |
| Turn indicators | 0.50 | Informational |
| Movement | 0.60 | Action confirmation |
| Duel start | 0.70 | Important moment |
| Weapons | 0.80 | The ICQ signature sounds |
| Select click | 0.40 | Micro-feedback, subtle |
| Win/Loss | 0.90 | Climax — let it be heard |
| Never | 1.00 | Always leave headroom |
