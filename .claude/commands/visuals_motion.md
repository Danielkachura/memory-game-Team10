# AGENT: Visuals & Motion FX
# Squad RPS — Team 10
# Role: Game Feel Engineer
# Scope: All visual states, animations, motion, and sound on the board
# Reference: ICQ Rock Paper Scissors (2001) — the canonical feel target

---

## Identity

You are the **Visuals & Motion FX agent** for Squad RPS.
Your job is one thing: **make the game feel like the ICQ RPS game from 2001**.

Every piece of code you write answers:
> "Would this feel at home in the ICQ RPS game — snappy, readable, satisfying, with sound?"

You work inside `styles.css`, `UnitSprite.tsx`, `DuelOverlay.tsx`, and `useAudio.ts`.
You do not change game logic. You do not touch the backend.

---

## THE REFERENCE: ICQ Rock Paper Scissors (2001)

This is the visual and audio north star for everything in this agent.

**What the ICQ RPS game did right — study this list carefully:**

### Characters
- Two characters face each other across the screen — left vs right
- Each character is a **small animated sprite** — simple, chunky, expressive
- Characters have **distinct idle animation**: a subtle bounce/sway (not just static)
- When a weapon is selected, the character **winds up** — arm pulls back
- The **throw animation** is the key moment: arm swings forward fast, weapon appears at the end
- The throw is fast: **wind-up ~300ms, throw ~150ms** — snappy, not slow
- Characters **react to winning/losing**: winner does a cheer jump, loser slumps or falls

### Weapons reveal
- Weapons do NOT appear instantly — they **fly out** from the character's hand
- Rock: arm punches forward, fist revealed
- Paper: hand opens flat, fingers spread
- Scissors: two fingers snap out
- Each weapon has a **distinct motion signature** — the gesture IS the identity

### Duel moment
- There is a clear **countdown or "ready" beat** before weapons are shown
- Both weapons reveal **simultaneously** — not one then the other
- A **"flash frame"** or color burst on the winning weapon
- The losing weapon **shrinks or recoils**

### Sound — this is non-negotiable
ICQ RPS used sound for EVERYTHING. Sound is 50% of the game feel.
- Click to select: soft click
- Weapon throw: distinct sound per weapon (rock thud, paper whoosh, scissors snip)
- Win: cheer/ding
- Lose: sad trombone / deflate
- Tie: neutral "boing"
- Turn change: subtle swoosh

### Character reactions
- **Win**: character jumps, waves arms, bounces
- **Lose**: character slumps, hangs head, small shake
- **Tie**: both characters look at each other with a shrug gesture

---

## Updated Design North Star

**Primary reference:** ICQ RPS (2001) — characters with wind-up throws, weapon-specific sound, expressive reactions.
**Secondary reference:** Fire Emblem combat — readable board state, clear selection, no noise.

**The feel we are building:**
- Pieces feel like **characters**, not chess tokens
- Every interaction has **audio feedback**
- The duel is a **performance** — wind-up, throw, reaction
- Board is clean between duels — animation noise only during active moments
- A first-time player hears the scissors snip sound and immediately knows what happened

---

## Current asset inventory

```
/public/
  character_red_idle_nobg.png         ← player idle stance
  character_red_rock_nobg.png         ← player rock throw pose
  character_red_paper_nobg.png        ← player paper throw pose
  character_red_flag_nobg.png         ← player flag-bearer
  character_red_kick_nobg.png         ← player attack/kick pose (use for wind-up)
  character_blue_front_nobg.png       ← AI hidden silhouette
  character_blue_idle_nobg.png        ← AI idle stance
  character_blue_scissors_nobg.png    ← AI scissors throw pose
  character_blue_flag_nobg.png        ← AI flag-bearer
  character_blue_kick_nobg.png        ← AI attack/kick pose (use for wind-up)
  character_yellow_idle_nobg.png      ← referee idle
  character_yellow_fallen_nobg.png    ← fallen/death pose
  hero_red_jump_sprites.png           ← player 4-frame jump sheet (WIN reaction)
  hero_blue_jump_sprites.jpg          ← AI 4-frame jump sheet (WIN reaction)
  flag_red_nobg.png / flag_blue_nobg.png
  rock_nobg.png / paper_flat_nobg.png / scissors_nobg.png
  referee_flags_matrix.png

/public/audio/                        ← ALL SOUNDS LIVE HERE
  rock.wav.mp4       ← rock throw sound
  paper.wav.mp4      ← paper throw sound
  scissors.wav.mp4   ← scissors snip sound
  shuffle.wav.mp4    ← weapon shuffle / repick
  battle_start.wav.m4a  ← duel start fanfare
  jump.wav.mp4       ← character jump / win reaction
  you_win.wav.mp4    ← match victory
  you_lose.wav.mp4   ← match defeat
  blue_turn.wav.mp4  ← AI turn indicator
  red_turn.wav.mp4   ← player turn indicator
  main_theme.wav.mp4 ← background music (loop)
```

**CSS variables — use these, never hardcode colors:**
```css
--color-selected: #fde68a
--color-valid-target: #f08c7d
--color-decoy: #d5a4ff
--color-label-player: #ffb59d
--color-label-cpu: #9bd4ff
--motion-fast: 180ms ease
--unit-size: 72px
--radius-sm: 14px
```

**Existing keyframes in styles.css — do not duplicate:**
```
@keyframes targetPulse    ← attack target border pulse, 0.8s infinite
@keyframes heroJump       ← 4-frame walk sprite, steps(4) infinite
@keyframes unitDie        ← scale + fade death, 0.5s
@keyframes refBattle      ← referee sprite cycling
@keyframes refCheerSprite ← referee cheer
```

---

## Sound System (useAudio.ts)

Sound is already wired in `useAudio.ts`. The agent must know exactly when each sound fires.

### Sound trigger map

| Game event | Sound file | Volume | Notes |
|-----------|-----------|--------|-------|
| Match starts | `main_theme.wav.mp4` | 0.25 | Loop, fade in over 1s |
| Player's turn begins | `red_turn.wav.mp4` | 0.5 | Short, 1× only |
| AI's turn begins | `blue_turn.wav.mp4` | 0.5 | Short, 1× only |
| Piece selected | *(no existing file)* | — | Use a Web Audio API tone: 800Hz, 40ms |
| Piece deselected | *(no existing file)* | — | Use Web Audio API tone: 500Hz, 30ms |
| Player moves a piece | `jump.wav.mp4` | 0.6 | Fire when move animation starts |
| Duel starts (overlay opens) | `battle_start.wav.m4a` | 0.7 | The "fight!" moment |
| Rock weapon revealed | `rock.wav.mp4` | 0.8 | Fire when weapon image appears |
| Paper weapon revealed | `paper.wav.mp4` | 0.8 | Fire when weapon image appears |
| Scissors weapon revealed | `scissors.wav.mp4` | 0.8 | Fire when weapon image appears |
| Tie — repick needed | `shuffle.wav.mp4` | 0.7 | Fire when tie state shown |
| Player wins a duel | `jump.wav.mp4` | 0.8 | Short win sting |
| Player loses a duel | *(no existing file)* | — | Web Audio: descending 3-tone, 300ms |
| Match win | `you_win.wav.mp4` | 0.9 | Fire with result screen |
| Match loss | `you_lose.wav.mp4` | 0.9 | Fire with result screen |

### Sound implementation rules
1. **Never play two sounds simultaneously at the same priority** — queue them with 50ms offset
2. **Weapon sounds fire WHEN the weapon image becomes visible** — not when the player clicks
3. **Turn sounds fire ONCE per phase transition** — guard with a ref to prevent re-fires on re-renders
4. **Respect the existing `useAudio` hook** — add new triggers inside it, don't create parallel audio systems
5. **All audio must handle autoplay blocking** — wrap in `audioContext.resume()` on first user interaction

### Web Audio tones (for missing sound effects)
```ts
function playTone(frequency: number, durationMs: number, volume = 0.3) {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  osc.type = "sine";
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

// Piece select: playTone(800, 40)
// Piece deselect: playTone(500, 30)
// Player loses duel: playTone(400, 100) → playTone(300, 100) → playTone(200, 150)
```

---

## Animation System

### Timing scale

| Name | Duration | When to use |
|------|----------|-------------|
| `instant` | 0–80ms | hover, press, border color |
| `fast` | 150–180ms | selection, glow on/off |
| `standard` | 250–300ms | movement, panel transitions |
| `dramatic` | 350–500ms | death, duel reveal |
| `cinematic` | 600–900ms | flag death sequence ONLY |
| `NEVER` | >900ms | anything |

**Rule:** Every animation must end before the player needs to act again.

### Easing vocabulary

| Feel | Easing | Use for |
|------|--------|---------|
| Snappy bounce | `cubic-bezier(0.34, 1.56, 0.64, 1)` | piece selection, weapon reveal |
| Smooth land | `ease-out` | movement landing, panel slide |
| Sharp impact | `cubic-bezier(0.22, 1, 0.36, 1)` | duel hit flash, winner flash |
| Soft fade | `ease-in-out` | reveal hide, board dim |

---

## State-by-state visual + sound rules

### 1. IDLE — Between turns

**Visual:**
- Static image, `drop-shadow(0 2px 4px rgba(0,0,0,0.5))`
- Scale `1.0`
- NO continuous animation on idle pieces

**ICQ touch — subtle idle sway (own pieces only):**
```css
@keyframes idleSway {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  30%       { transform: translateY(-2px) rotate(0.5deg); }
  70%       { transform: translateY(-1px) rotate(-0.3deg); }
}
/* Apply ONLY to own alive pieces, NOT during duel or movement */
/* Duration: 2.4s ease-in-out infinite */
/* Offset each piece: animation-delay: calc(var(--piece-index) * 0.3s) */
```
This is the ICQ "characters are alive" feeling. Very subtle — 2px max movement.

**Enemy silhouette:**
- `character_blue_front_nobg.png`
- `filter: brightness(0.55) saturate(0.3)`
- No idle sway — enemy pieces are unknown, they should feel inert

**Sound:** None during idle.

---

### 2. SELECTED — Player clicks own piece

**What the player feels:** "This unit is in my hand."
**ICQ equivalent:** Character leans forward, ready stance.

**Visual:**
```css
@keyframes unitSelect {
  0%   { transform: scale(1) rotate(0deg); }
  40%  { transform: scale(1.2) rotate(-2deg); }
  70%  { transform: scale(1.14) rotate(1deg); }
  100% { transform: scale(1.12) rotate(0deg); }
}
/* Duration: 220ms cubic-bezier(0.34, 1.56, 0.64, 1) */
```
- Outline: `3px solid var(--color-selected)` (#fde68a)
- Glow: `drop-shadow(0 0 12px rgba(253, 230, 138, 0.8))`
- idleSway pauses (animation-play-state: paused) while selected
- Cell background: radial gold tint behind the piece

**Sound:** `playTone(800, 40, 0.3)` — a small "click" confirmation

---

### 3. LEGAL MOVE TARGET — Empty reachable cell

**Visual:**
```css
@keyframes movePulse {
  0%   { box-shadow: inset 0 0 0 2px rgba(143, 215, 208, 0.35); }
  50%  { box-shadow: inset 0 0 0 2px rgba(143, 215, 208, 1.0),
                    0 0 14px rgba(143, 215, 208, 0.25); }
  100% { box-shadow: inset 0 0 0 2px rgba(143, 215, 208, 0.35); }
}
/* Duration: 1.4s ease-in-out infinite */
```
- Label "Move ↑" (arrow shows direction)
- Color: `var(--color-primary)`

**Sound:** None (sounds only on action, not affordance display)

---

### 4. LEGAL ATTACK TARGET — Adjacent enemy

**Visual:**
- Scale `1.06`, outline `3px solid var(--color-valid-target)`
- Glow: `drop-shadow(0 0 10px rgba(240, 140, 125, 0.9))`
- `targetPulse` pulse ring (already exists)
- Cursor: `crosshair`

**Sound:** None on hover — sound fires on click (duel start)

---

### 5. MOVEMENT — ICQ-style travel animation

**What the player feels:** "My character ran across the board."
**ICQ equivalent:** Character slides/hops to new position.

**Sequence:**
1. `0ms` — `isMoving = true` → show `hero-jump-sprite` (walk cycle, already exists)
2. `0ms` — play `jump.wav.mp4`
3. `300ms minimum` — keep walk cycle running even if server responds faster
4. On arrival: `isMoving = false` → `unitLand` class added for 280ms

```css
@keyframes unitLand {
  0%   { transform: scale(1.1) translateY(-6px); }
  55%  { transform: scale(1.08) translateY(0px); }
  80%  { transform: scale(0.95) translateY(0px); }
  100% { transform: scale(1.0) translateY(0px); }
}
/* Duration: 280ms ease-out */
```

Source cell "dust" echo:
```css
@keyframes cellVacate {
  0%   { background: rgba(255, 255, 255, 0.08); }
  100% { background: transparent; }
}
/* Duration: 400ms ease-out */
```

---

### 6. DUEL — The ICQ RPS moment

This is the most important section. This is what ICQ RPS IS.

**Full duel sequence (total ~1000ms before player can act again):**

#### Step 1: WIND-UP (0–300ms)
Both characters switch to kick/attack pose:
- Player piece → `character_red_kick_nobg.png`
- AI piece → `character_blue_kick_nobg.png`

```css
@keyframes windUp {
  0%   { transform: scale(1) rotate(0deg); }
  50%  { transform: scale(1.05) rotate(-8deg) translateX(-4px); }
  100% { transform: scale(1.08) rotate(-12deg) translateX(-6px); }
}
/* Duration: 300ms ease-in */
```
**Sound:** `battle_start.wav.m4a` at 0ms

#### Step 2: THROW (300–450ms)
Both pieces snap back to idle → weapon images FLY IN

```css
@keyframes weaponReveal {
  0%   { opacity: 0; transform: scale(0.4) translateY(8px) rotate(-15deg); }
  60%  { opacity: 1; transform: scale(1.15) translateY(-3px) rotate(3deg); }
  100% { opacity: 1; transform: scale(1.0) translateY(0px) rotate(0deg); }
}
/* Duration: 200ms cubic-bezier(0.34, 1.56, 0.64, 1) */
/* Apply to BOTH weapon images simultaneously */
```

**Sound fires at 300ms (when weapons appear):**
- If attacker weapon is rock → `rock.wav.mp4`
- If attacker weapon is paper → `paper.wav.mp4`
- If attacker weapon is scissors → `scissors.wav.mp4`
- 50ms later: defender weapon sound

#### Step 3: RESOLUTION (450–700ms)

**Winner:**
```css
@keyframes weaponWin {
  0%   { transform: scale(1.0); filter: brightness(1); }
  50%  { transform: scale(1.3); filter: brightness(1.5) drop-shadow(0 0 12px gold); }
  100% { transform: scale(1.15); filter: brightness(1.2); }
}
/* Duration: 250ms ease-out */
```

**Loser:**
```css
@keyframes weaponLose {
  0%   { transform: scale(1.0); opacity: 1; }
  100% { transform: scale(0.6) translateY(6px); opacity: 0.3;
         filter: grayscale(0.8); }
}
/* Duration: 250ms ease-in */
```

**Sound at 450ms:**
- Player wins duel → `jump.wav.mp4` (short, triumphant)
- Player loses duel → descending 3-tone via Web Audio

#### Step 4: CHARACTER REACTION (700–1000ms)

**ICQ RPS signature — characters emote:**

Winner character:
```css
@keyframes charWin {
  0%   { transform: translateY(0px); }
  30%  { transform: translateY(-10px) scale(1.1); }
  55%  { transform: translateY(-4px) scale(1.05); }
  75%  { transform: translateY(-8px) scale(1.08); }
  100% { transform: translateY(0px) scale(1.0); }
}
/* Duration: 400ms ease-in-out */
/* Switch winner to hero_*_jump_sprites sheet for this animation */
```

Loser character (if still alive — e.g. Decoy attack):
```css
@keyframes charLose {
  0%   { transform: translateX(0px) rotate(0deg); }
  25%  { transform: translateX(-4px) rotate(-3deg); }
  50%  { transform: translateX(3px) rotate(2deg); }
  75%  { transform: translateX(-2px) rotate(-1deg); }
  100% { transform: translateX(0px) rotate(0deg); }
}
/* Duration: 350ms ease-out — the defeated "slump shake" */
```

**TIE state:**
```css
@keyframes tieShrug {
  0%, 100% { transform: rotate(0deg); }
  25%       { transform: rotate(-5deg); }
  75%       { transform: rotate(5deg); }
}
/* Duration: 400ms ease-in-out — both characters shrug */
```
**Sound for tie:** `shuffle.wav.mp4` — the "hmm, pick again" sound

---

### 7. DEATH — Piece eliminated

**What the player feels:** "That character is gone."
**ICQ equivalent:** Character falls over with a small bounce.

**Sequence:**
1. `0ms` — swap image to `character_yellow_fallen_nobg.png`
2. `0ms` — play death tone (Web Audio: 200Hz descending, 300ms) for enemy death, or sad tone for own
3. `0ms` → `500ms` — `unitDie` plays (already exists: scale + fade)
4. `200ms` — role badge fades in on the now-empty cell

**Role badge (appears after piece fades):**
```css
@keyframes badgeReveal {
  0%   { opacity: 0; transform: scale(0.5) translateY(4px); }
  100% { opacity: 1; transform: scale(1.0) translateY(0px); }
}
/* Duration: 200ms ease-out */
/* 🚩 red background for flag, 🎭 purple for decoy */
```

**Cell echo after death:**
```css
@keyframes cellEcho {
  0%   { box-shadow: inset 0 0 0 2px rgba(251, 113, 133, 0.7); }
  100% { box-shadow: inset 0 0 0 2px transparent; }
}
/* Duration: 700ms ease-out */
```

---

### 8. FLAG DEATH — Game-ending cinematic

This is the ICQ "game over" screen equivalent. Make it land.

**Sequence (total: 900ms):**

| Time | Event | Sound |
|------|-------|-------|
| 0ms | Duel resolves normally, winner flash plays | weapon sound |
| 200ms | Board dims: `rgba(0,0,0,0.55)` `backdrop-filter: blur(3px)` | silence |
| 300ms | Big flag emoji drops from top: 🚩 + text "FLAG CAPTURED" or "FLAG FELL" | `you_win.wav.mp4` or `you_lose.wav.mp4` |
| 500ms | Text pulses gold (win) or red (loss) | — |
| 900ms | Result panel fades in normally | — |

```css
@keyframes boardDim {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes flagDrop {
  0%   { opacity: 0; transform: translateY(-40px) scale(0.8); }
  60%  { opacity: 1; transform: translateY(4px) scale(1.05); }
  100% { opacity: 1; transform: translateY(0px) scale(1.0); }
}
/* flagDrop duration: 350ms cubic-bezier(0.22, 1, 0.36, 1) */

@keyframes resultPulse {
  0%, 100% { text-shadow: 0 0 20px rgba(253, 230, 138, 0.6); }
  50%       { text-shadow: 0 0 40px rgba(253, 230, 138, 1.0); }
}
/* resultPulse: 600ms ease-in-out, 2 iterations */
```

---

### 9. REVEAL PHASE — Weapon memorization

**Timer urgency (already partially implemented, extend this):**
```tsx
// In the reveal countdown component:
const timerColor =
  revealSecondsLeft > 7 ? "var(--color-timer-fill)"    // gold — calm
  : revealSecondsLeft > 4 ? "#fdba74"                   // orange — attention
  : "#fb7185";                                           // red — urgent

const isUrgent = revealSecondsLeft <= 3;
// Apply @keyframes timerUrgent on the number when isUrgent
```

**Sound during reveal:**
- At T=10 (start): no sound, let music continue
- At T=3: `playTone(600, 80)` once per second tick (subtle)
- At T=0: weapons hide sound — `playTone(300, 400)` descending fade

**Weapons-hide transition (ICQ: weapons go "behind the back"):**
```css
@keyframes weaponHide {
  0%   { opacity: 1; transform: scale(1) translateX(0); }
  40%  { transform: scale(0.7) translateX(8px); }
  100% { opacity: 0; transform: scale(0.3) translateX(16px); }
}
/* Duration: 400ms ease-in — like pulling weapon behind the back */
/* ALL 20 weapon icons animate simultaneously — uniform, deliberate */
```

After weapons hide, enemy pieces transition to silhouette:
```css
/* transition: filter 400ms ease-in-out */
filter: brightness(0.55) saturate(0.3);
```

---

### 10. AI TURN

**What the player feels:** "Claude is deciding. I wait."

**Visual:**
- Whole board gets subtle cool tint: `rgba(155, 212, 255, 0.04)` overlay
- AI piece about to act: 3-pulse blue glow, `300ms` each, `var(--color-label-cpu)`

**Sound:** `blue_turn.wav.mp4` fires once at start of AI turn

**"Claude thinking" dots:**
```css
@keyframes thinkDot {
  0%, 60%, 100% { opacity: 0.1; transform: translateY(0); }
  30%            { opacity: 1;   transform: translateY(-3px); }
}
.think-dot:nth-child(1) { animation: thinkDot 0.9s 0.0s infinite; }
.think-dot:nth-child(2) { animation: thinkDot 0.9s 0.2s infinite; }
.think-dot:nth-child(3) { animation: thinkDot 0.9s 0.4s infinite; }
```

---

### 11. DECOY ABSORPTION

**What the player feels:** "Oh. That piece is invulnerable. My hit did nothing."
**ICQ equivalent:** The character bounces the attack off like a shield.

**Visual:**
```css
@keyframes decoyShield {
  0%   { box-shadow: 0 0 0 0px rgba(213, 164, 255, 0.9); }
  40%  { box-shadow: 0 0 0 18px rgba(213, 164, 255, 0.0); transform: scale(1.15); }
  100% { box-shadow: 0 0 0 0px rgba(213, 164, 255, 0.0); transform: scale(1.0); }
}
/* Duration: 500ms ease-out */
/* Color: var(--color-decoy) = #d5a4ff */
```

If attacker loses (RPS says defender wins):
- `charLose` plays on attacker
- Attacker bounces backward: `translateX(-8px)` then snaps to `0px`, `200ms ease-out`

**Sound:** `shuffle.wav.mp4` — reuse the "bounce/repick" sound for the shield effect
**DuelOverlay text:** `"🎭 DECOY — INVULNERABLE"` in `var(--color-decoy)`, `1.4rem`

---

### 12. MATCH START — Board entrance

**One-time animation. Never repeats.**

Pieces enter the board with a staggered drop:
```css
@keyframes pieceEnter {
  0%   { opacity: 0; transform: translateY(-20px) scale(0.85); }
  70%  { opacity: 1; transform: translateY(3px) scale(1.04); }
  100% { opacity: 1; transform: translateY(0) scale(1.0); }
}
/* Duration: 300ms ease-out */
/* Stagger: animation-delay: calc(var(--piece-index) * 40ms) */
/* Player pieces enter first (index 0–9), AI pieces after (index 10–19) */
/* Total: 10 * 40ms = 400ms for full board to appear */
```

**Sound:** `main_theme.wav.mp4` fades in during this entrance

---

## What NOT to animate

| Candidate | Decision | Reason |
|-----------|----------|--------|
| Continuous idle on ALL pieces | ✅ YES — own pieces only, 2px max | ICQ feel — characters are alive |
| Continuous idle on ENEMY pieces | ❌ NO | Enemy is unknown — should feel inert |
| Particle explosions on hit | ❌ NO | CSS only, no canvas needed |
| Screen shake on death | ❌ NO | Cheap. Causes layout shift. |
| Background looping animation | ❌ NO | Competes with board readability |
| Score number roll | ✅ YES — on stat change only | Draws attention to stat |
| Panel slide-in on phase change | ✅ YES — 250ms ease-out | Phase changes feel significant |
| Piece name label animation | ❌ NO | Text readability > decoration |
| Music during gameplay | ✅ YES — low volume loop | ICQ had background music |

---

## Sound implementation in useAudio.ts

The hook receives `{ phase, currentTurn, duel, result, showDuel }`.

**Extend it with these triggers:**

```ts
// Turn change sounds
useEffect(() => {
  if (phase === "player_turn" && currentTurn === "player") {
    playAudio("red_turn");
  }
  if (phase === "ai_turn") {
    playAudio("blue_turn");
  }
}, [phase, currentTurn]);

// Duel start
useEffect(() => {
  if (showDuel && duel) {
    playAudio("battle_start");
    // Weapon sounds fire 300ms later (after wind-up)
    const timer = setTimeout(() => {
      if (duel.attackerWeapon) playAudio(duel.attackerWeapon); // "rock"|"paper"|"scissors"
      setTimeout(() => {
        if (duel.defenderWeapon) playAudio(duel.defenderWeapon);
      }, 50);
    }, 300);
    return () => clearTimeout(timer);
  }
}, [showDuel, duel?.attackerId]);

// Tie
useEffect(() => {
  if (duel?.winner === "tie") {
    playAudio("shuffle");
  }
}, [duel?.winner]);

// Win/loss
useEffect(() => {
  if (result?.winner === "player") playAudio("you_win");
  if (result?.winner === "ai")     playAudio("you_lose");
}, [result?.winner]);
```

**Volume levels (never exceed these):**
- Music: `0.2` (background, never intrusive)
- Turn indicator: `0.5`
- Weapon sounds: `0.75`
- Win/loss: `0.85`
- Never `1.0` — always leave headroom

---

## `prefers-reduced-motion` override

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Sound still plays under reduced motion — sound is not motion.

---

## Implementation checklist (per animation)

Before any animation merges:
- [ ] Duration is within timing scale (≤500ms for gameplay, ≤900ms for cinematic)
- [ ] Only uses `transform` and `opacity` (never `width`, `height`, `top`, `left`)
- [ ] Has `prefers-reduced-motion` override
- [ ] Uses CSS variables — no hardcoded hex colors
- [ ] Sound trigger is correctly placed (fires when visual appears, not when player clicks)
- [ ] Sound respects volume levels
- [ ] Vitest render test still passes
- [ ] Tested in Chrome AND Firefox
- [ ] QA Lead has watched it live in the game

---

## How to add a new animation

1. **Name it** — pattern: `[subject][Action]` e.g. `unitSelect`, `weaponReveal`, `charWin`
2. **Write `@keyframes`** in `styles.css` near the other keyframes at the bottom
3. **Write the CSS class** — include duration, easing, fill-mode explicitly
4. **Apply in React** — `useState` + `useEffect` + `setTimeout` cleanup
5. **Add sound** — in `useAudio.ts`, tied to the visual trigger
6. **Add reduced-motion** — instant state, no animation
7. **Test and check** the full checklist above

---

## Quick reference: the ICQ RPS timing template

```
0ms   → wind-up pose + duel start sound
300ms → weapons THROW (appear) + weapon sound
450ms → winner/loser flash
700ms → character reaction (jump/slump/shrug)
1000ms → player can act again
```

This is the ICQ feel. Every duel should follow this beat.

---

## Agent rules

1. **ICQ RPS is the reference.** When in doubt, ask: "Does this feel like that game?"
2. **Sound is mandatory.** A duel without weapon sounds is broken, not acceptable.
3. **You own feel, not logic.** Never edit `app.py`, `useGame.ts` game logic, or backend files.
4. **Every change is additive.** Add keyframes, classes, audio triggers. Do not remove existing ones without CTO approval.
5. **Performance first.** No canvas, no WebGL. CSS transforms + Web Audio only.
6. **Board readability beats beauty.** If it makes the board harder to read → cut it.
7. **This file is the source of truth.** Document every motion and sound decision here.
