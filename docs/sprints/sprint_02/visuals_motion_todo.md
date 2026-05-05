# Sprint 02 — visuals_motion_todo.md
# Squad RPS — Team 10
# Author: Visuals & Motion FX Agent
# Reference: ICQ Rock Paper Scissors (2001) — video reference confirmed
# Based on: full audit of useAudio.ts, UnitSprite.tsx, DuelOverlay.tsx, styles.css

---

## Sprint Goal (Visuals)
Make every game moment feel exactly like the ICQ RPS video:
characters wind up, weapons fly out, sound fires on the throw, winner jumps, loser slumps.
A first-time player should watch one duel and immediately understand — without reading anything.

---

## ICQ RPS Beat Map (the master reference)

```
0ms    character leans forward — WIND-UP pose
300ms  arm snaps forward — WEAPON APPEARS mid-air  ← sound fires HERE
450ms  winner weapon FLASHES gold / loser weapon shrinks
700ms  winner character JUMPS / loser SLUMPS
1000ms board returns to normal — player can act
```

Every duel task below is derived from this beat map.

---

## TASK LIST

---

### VM-01 — Wire `useAudio.ts` to actually play sounds
**File:** `frontend/modules/game/src/hooks/useAudio.ts`
**Complexity:** M
**Priority:** 🔴 BLOCKER — all sound tasks depend on this

**Current state:** `useAudio` computes a `signature` string and reads `squad-rps-audio-mode` from localStorage, but **plays nothing**. The hook body is empty after the preferences check.

**What to build:**

```ts
// 1. Create a helper inside the hook:
function playSound(filename: string, volume = 0.7) {
  const audio = new Audio(`/audio/${filename}`);
  audio.volume = volume;
  audio.play().catch(() => {}); // swallow autoplay block silently
}

// 2. Add these triggers inside useEffect, guarded by signature change:

// Turn sounds
if (state.phase === "player_turn" && state.currentTurn === "player") {
  playSound("red_turn.wav.mp4", 0.5);
}
if (state.phase === "ai_turn") {
  playSound("blue_turn.wav.mp4", 0.5);
}

// Duel start
if (state.showDuel && state.duel) {
  playSound("battle_start.wav.m4a", 0.7);
}

// Win / loss
if (state.result?.winner === "player") playSound("you_win.wav.mp4", 0.9);
if (state.result?.winner === "ai")     playSound("you_lose.wav.mp4", 0.9);
```

**Acceptance:** Turn starts → sound plays. Match ends → win/lose sound plays. No double-firing on re-renders.

---

### VM-02 — Weapon-specific sounds on duel throw
**File:** `frontend/modules/game/src/hooks/useAudio.ts`
**Complexity:** S
**Priority:** 🔴 BLOCKER — this is the ICQ signature sound

**Current state:** `useAudio` receives `duel` as `unknown`. No weapon sounds fire.

**What to build:**

Extend `AudioState` type to expose weapons:
```ts
type AudioState = {
  phase: Phase;
  currentTurn: "player" | "ai" | "none";
  duel: {
    attackerWeapon?: string;
    defenderWeapon?: string;
    winner?: string;
    tie?: boolean;
    attackerId?: string;
  } | null;
  result: { winner: string } | null;
  showDuel: boolean;
};
```

Add to `useEffect`:
```ts
if (state.showDuel && state.duel?.attackerWeapon) {
  // Weapons fire 300ms after duel opens — this is the "throw" moment
  const timer = setTimeout(() => {
    const w = state.duel!.attackerWeapon!;
    if (w === "rock")     playSound("rock.wav.mp4", 0.8);
    if (w === "paper")    playSound("paper.wav.mp4", 0.8);
    if (w === "scissors") playSound("scissors.wav.mp4", 0.8);
    // Defender sound 50ms later
    setTimeout(() => {
      const d = state.duel!.defenderWeapon!;
      if (d === "rock")     playSound("rock.wav.mp4", 0.6);
      if (d === "paper")    playSound("paper.wav.mp4", 0.6);
      if (d === "scissors") playSound("scissors.wav.mp4", 0.6);
    }, 50);
  }, 300);
  return () => clearTimeout(timer);
}
// Tie sound
if (state.duel?.tie) {
  playSound("shuffle.wav.mp4", 0.7);
}
// Win duel sound
if (state.duel?.winner === "attacker" && state.duel?.attackerId?.startsWith("player")) {
  setTimeout(() => playSound("jump.wav.mp4", 0.8), 450);
}
```

**Acceptance:** Rock sounds like a rock. Scissors sounds like scissors. Attacker weapon fires first, defender 50ms later. Tie fires shuffle sound.

---

### VM-03 — Idle sway animation on own pieces
**File:** `frontend/app/src/styles.css` + `frontend/modules/game/src/components/UnitSprite.tsx`
**Complexity:** S
**Priority:** 🟡 HIGH

**Current state:** Own pieces are completely static between turns. ICQ characters always had a subtle alive sway.

**CSS to add** (append to keyframes section of `styles.css`):
```css
@keyframes idleSway {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  30%       { transform: translateY(-2px) rotate(0.4deg); }
  70%       { transform: translateY(-1px) rotate(-0.3deg); }
}
```

**In `UnitSprite.tsx`**, add class conditionally:
```tsx
// Add to the outer <button> className:
className={[
  isDying ? "piece-dying" : "",
  !isDying && !isMoving && piece.owner === "player" && piece.alive ? "unit-idle-sway" : "",
].join(" ").trim()}
```

**CSS class:**
```css
.unit-idle-sway {
  animation: idleSway 2.4s ease-in-out infinite;
  animation-delay: calc(var(--sway-offset, 0) * 1s);
}
```

Pass `--sway-offset` via inline style based on piece index (0–9 × 0.3s) in `GameScreen.tsx`.

**Rules:**
- Own pieces only (`piece.owner === "player"` or viewer's own pieces)
- Enemy silhouettes: NO sway — they must feel inert
- Pauses when `selected` (animation-play-state: paused)
- Max 2px movement — subtle, not distracting

**Acceptance:** Own pieces gently sway. Enemy pieces are still. Selected piece stops swaying immediately.

---

### VM-04 — Selection bounce animation
**File:** `frontend/app/src/styles.css` + `frontend/modules/game/src/components/UnitSprite.tsx`
**Complexity:** S
**Priority:** 🟡 HIGH

**Current state:** Selection only changes `transform: scale(1.12)` via inline style — no bounce, instant snap.

**CSS to add:**
```css
@keyframes unitSelect {
  0%   { transform: scale(1) rotate(0deg); }
  40%  { transform: scale(1.22) rotate(-2deg); }
  70%  { transform: scale(1.14) rotate(1deg); }
  100% { transform: scale(1.12) rotate(0deg); }
}

.unit-selected {
  animation: unitSelect 220ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  outline: 3px solid var(--color-selected);
  filter: drop-shadow(0 0 12px rgba(253, 230, 138, 0.8));
}
```

**In `UnitSprite.tsx`:** Remove inline `transform` and `outline` for selected state. Replace with class:
```tsx
className={[
  isDying ? "piece-dying" : "",
  selected ? "unit-selected" : "",
  !isDying && !selected && !isMoving && piece.owner === "player" ? "unit-idle-sway" : "",
].join(" ").trim()}
```

**Acceptance:** Clicking own piece plays a satisfying bounce-to-selected. Not a snap — a bounce. Gold glow appears.

---

### VM-05 — Wind-up pose before duel (ICQ signature)
**File:** `frontend/modules/game/src/components/DuelOverlay.tsx` + `frontend/modules/game/src/components/UnitSprite.tsx`
**Complexity:** M
**Priority:** 🔴 BLOCKER — this is what makes it feel like ICQ

**Current state:** `DuelOverlay` appears instantly with static weapon images. There is no wind-up. Weapons just appear.

**What to build:**

In `DuelOverlay.tsx`, add an internal `phase` state:
```tsx
type DuelPhase = "windup" | "throw" | "resolved";
const [duelPhase, setDuelPhase] = useState<DuelPhase>("windup");

useEffect(() => {
  if (!visible) { setDuelPhase("windup"); return; }
  // Wind-up: 0–300ms
  const t1 = setTimeout(() => setDuelPhase("throw"), 300);
  // Resolved: 450ms
  const t2 = setTimeout(() => setDuelPhase("resolved"), 450);
  return () => { clearTimeout(t1); clearTimeout(t2); };
}, [visible]);
```

**Wind-up (0–300ms):** Show character images in attack pose, NO weapon images yet:
```tsx
{duelPhase === "windup" && (
  <div className="duel-windup">
    <img src={attackerIsPlayer ? "/character_red_kick_nobg.png" : "/character_blue_kick_nobg.png"} />
    <div className="duel-vs-text">⚔️</div>
    <img src={defenderIsPlayer ? "/character_red_kick_nobg.png" : "/character_blue_kick_nobg.png"} />
  </div>
)}
```

**Throw (300ms+):** Weapon images fly in with `weaponReveal` animation:
```tsx
{(duelPhase === "throw" || duelPhase === "resolved") && (
  <WeaponCard weapon={duel.attackerWeapon} unitId={duel.attackerId} label={duel.attackerName}
    className={duelPhase === "throw" ? "weapon-reveal" : ""} />
)}
```

**CSS to add:**
```css
@keyframes windUpPose {
  0%   { transform: scale(1) rotate(0deg); }
  50%  { transform: scale(1.06) rotate(-10deg) translateX(-4px); }
  100% { transform: scale(1.08) rotate(-14deg) translateX(-6px); }
}

@keyframes weaponReveal {
  0%   { opacity: 0; transform: scale(0.4) translateY(10px) rotate(-15deg); }
  60%  { opacity: 1; transform: scale(1.18) translateY(-4px) rotate(4deg); }
  100% { opacity: 1; transform: scale(1.0) translateY(0) rotate(0deg); }
}

.duel-windup img {
  animation: windUpPose 300ms ease-in forwards;
}

.weapon-reveal {
  animation: weaponReveal 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

**Acceptance:** Observer sees: characters lean in → weapons fly out → result. Matches the ICQ beat map exactly.

---

### VM-06 — Winner flash / loser shrink on duel resolution
**File:** `frontend/modules/game/src/components/DuelOverlay.tsx`
**Complexity:** S
**Priority:** 🔴 BLOCKER

**Current state:** After duel resolves, both weapon images stay identical — no visual distinction between winner and loser.

**CSS to add:**
```css
@keyframes weaponWin {
  0%   { transform: scale(1.0); filter: brightness(1); }
  50%  { transform: scale(1.35); filter: brightness(1.6) drop-shadow(0 0 14px gold); }
  100% { transform: scale(1.15); filter: brightness(1.2) drop-shadow(0 0 6px gold); }
}

@keyframes weaponLose {
  0%   { transform: scale(1.0); opacity: 1; filter: none; }
  100% { transform: scale(0.55) translateY(8px); opacity: 0.25; filter: grayscale(1); }
}

.weapon-winner { animation: weaponWin  250ms ease-out forwards; }
.weapon-loser  { animation: weaponLose 250ms ease-in  forwards; }
```

**In `DuelOverlay.tsx`**, in the `"resolved"` phase apply classes:
```tsx
const attackerWon = duel.winner === "attacker";
// Attacker WeaponCard:
className={duelPhase === "resolved" ? (attackerWon ? "weapon-winner" : "weapon-loser") : ""}
// Defender WeaponCard:
className={duelPhase === "resolved" ? (attackerWon ? "weapon-loser" : "weapon-winner") : ""}
```

**Tie:** Neither weapon wins. Apply `tieShake` to the `=` divider:
```css
@keyframes tieShake {
  0%, 100% { transform: translateX(0) scale(1); }
  25%       { transform: translateX(-5px) scale(1.1); }
  75%       { transform: translateX(5px) scale(1.1); }
}
.tie-divider--shake { animation: tieShake 300ms ease; }
```

**Acceptance:** Gold flash on winner, grey shrink on loser. Tie shakes. All 3 states visually distinct.

---

### VM-07 — Character win/lose/tie reaction
**File:** `frontend/modules/game/src/components/DuelOverlay.tsx`
**Complexity:** M
**Priority:** 🟡 HIGH — the ICQ "cheer/slump" moment

**Current state:** After duel resolves, character images disappear. There is no reaction.

**CSS to add:**
```css
@keyframes charWin {
  0%   { transform: translateY(0px) scale(1); }
  25%  { transform: translateY(-12px) scale(1.12); }
  50%  { transform: translateY(-6px) scale(1.08); }
  75%  { transform: translateY(-10px) scale(1.1); }
  100% { transform: translateY(0px) scale(1); }
}

@keyframes charLose {
  0%   { transform: rotate(0deg) translateX(0); }
  20%  { transform: rotate(-4deg) translateX(-3px); }
  50%  { transform: rotate(3deg) translateX(2px); }
  80%  { transform: rotate(-2deg) translateX(-1px); }
  100% { transform: rotate(0deg) translateX(0); }
}

@keyframes charTie {
  0%, 100% { transform: rotate(0deg); }
  30%       { transform: rotate(-6deg); }
  70%       { transform: rotate(6deg); }
}

.char-reaction--win  { animation: charWin  400ms ease-in-out; }
.char-reaction--lose { animation: charLose 350ms ease-out; }
.char-reaction--tie  { animation: charTie  400ms ease-in-out; }
```

**In `DuelOverlay.tsx`**, at `duelPhase === "resolved"`, show small character images below the weapons:
```tsx
{duelPhase === "resolved" && !repick && (
  <div className="duel-reactions">
    <img
      src={attackerIsPlayer ? "/hero_red_jump_sprites.png" : "/character_blue_idle_nobg.png"}
      className={`char-reaction--${attackerWon ? "win" : "lose"}`}
      style={{ width: 56, height: 56 }}
    />
    <img
      src={defenderIsPlayer ? "/hero_red_jump_sprites.png" : "/character_blue_idle_nobg.png"}
      className={`char-reaction--${attackerWon ? "lose" : "win"}`}
      style={{ width: 56, height: 56 }}
    />
  </div>
)}
{duelPhase === "resolved" && duel.winner === "tie" && (
  <div className="duel-reactions">
    <img src="/character_red_idle_nobg.png" className="char-reaction--tie" style={{ width: 56 }} />
    <img src="/character_blue_idle_nobg.png" className="char-reaction--tie" style={{ width: 56 }} />
  </div>
)}
```

**Acceptance:** Winner bounces twice. Loser shakes/slumps. Tie — both characters shrug-rotate. This is the ICQ moment.

---

### VM-08 — Movement land bounce
**File:** `frontend/app/src/styles.css` + `frontend/modules/game/src/components/GameScreen.tsx`
**Complexity:** S
**Priority:** 🟡 HIGH

**Current state:** Walk sprite plays during move (`isMoving`), but when the piece arrives it just snaps to the new cell — no landing feel.

**CSS to add:**
```css
@keyframes unitLand {
  0%   { transform: scale(1.1) translateY(-7px); }
  55%  { transform: scale(1.09) translateY(0px); }
  80%  { transform: scale(0.94) translateY(0px); }
  100% { transform: scale(1.0) translateY(0px); }
}

.unit-landing {
  animation: unitLand 280ms ease-out forwards;
}
```

**In `GameScreen.tsx`**: After a move resolves, find the piece at the new cell and add `unit-landing` class for 280ms via `useState` tracking a `landingPieceId`.

```tsx
const [landingPieceId, setLandingPieceId] = useState<string | null>(null);

// After movePiece resolves:
setLandingPieceId(movedPieceId);
setTimeout(() => setLandingPieceId(null), 280);

// In the board render, pass to UnitSprite:
isLanding={cell.piece?.id === landingPieceId}
```

Add `isLanding` prop to `UnitSprite` and apply `.unit-landing` class.

**Also: minimum 300ms walk animation** — even if server responds in 50ms, keep `isMoving = true` for 300ms minimum so movement feels like travel, not teleportation.

**Acceptance:** Piece walks → arrives → bounces down to settle. Feels like weight landing, not a snap.

---

### VM-09 — Death pose + cell echo
**File:** `frontend/modules/game/src/components/UnitSprite.tsx` + `frontend/modules/game/src/components/GameScreen.tsx`
**Complexity:** S
**Priority:** 🟡 HIGH

**Current state:** `unitDie` plays (scale + fade). No death pose swap. No cell echo after death.

**What to add to `UnitSprite.tsx`:**

Before `unitDie` fires, swap image to fallen pose:
```tsx
// When isDying becomes true, show fallen image first
const deathSrc = "/character_yellow_fallen_nobg.png";
<img
  src={isDying ? deathSrc : getSrc(piece)}
  style={{
    width: "100%", height: "100%", objectFit: "contain",
    transition: "none", // instant swap
  }}
/>
```

**CSS — cell echo** (add to `styles.css`):
```css
@keyframes cellEcho {
  0%   { box-shadow: inset 0 0 0 2px rgba(251, 113, 133, 0.7), 0 0 14px rgba(251, 113, 133, 0.4); }
  100% { box-shadow: inset 0 0 0 2px transparent; }
}

.nati-board-cell--echo {
  animation: cellEcho 700ms ease-out forwards;
}
```

**In `GameScreen.tsx`**: Track `echoCells: Set<string>` — add `"row-col"` key when a piece dies, remove after 700ms. Apply `.nati-board-cell--echo` to matching cells.

**Acceptance:** Piece switches to fallen pose → fades out → cell glows red briefly → fades. Three clear visual beats.

---

### VM-10 — Revealed role badge after death
**File:** `frontend/modules/game/src/components/GameScreen.tsx` (cell render)
**Complexity:** S
**Priority:** 🟡 HIGH

**Current state:** When a piece dies, its role is revealed in the duel summary but the cell on the board shows nothing.

**What to build:**

In the board cell render, after a piece is dead and its role is known, show a small badge in the empty cell:
```tsx
{!cell.piece && deadRoleAtCell === "flag" && (
  <div className="cell-role-badge cell-role-badge--flag">🚩</div>
)}
{!cell.piece && deadRoleAtCell === "decoy" && (
  <div className="cell-role-badge cell-role-badge--decoy">🎭</div>
)}
```

**CSS:**
```css
@keyframes badgeReveal {
  0%   { opacity: 0; transform: scale(0.5) translateY(5px); }
  100% { opacity: 1; transform: scale(1.0) translateY(0px); }
}

.cell-role-badge {
  font-size: 1.4rem;
  animation: badgeReveal 200ms ease-out forwards;
}

.cell-role-badge--flag  { filter: drop-shadow(0 0 6px rgba(251, 113, 133, 0.8)); }
.cell-role-badge--decoy { filter: drop-shadow(0 0 6px rgba(213, 164, 255, 0.8)); }
```

Track `deadPiecesByCell: Map<string, Role>` in `GameScreen` — populate from `match.board` where `alive === false && role !== "soldier"`.

**Acceptance:** After a piece dies, its cell shows 🚩 or 🎭. Bounces in. Stays for the rest of the match.

---

### VM-11 — Flag death cinematic sequence
**File:** `frontend/modules/game/src/components/GameScreen.tsx`
**Complexity:** M
**Priority:** 🔴 BLOCKER — this is the game's climax moment

**Current state:** When the Flag dies, `match.result` is set and the embedded result panel just appears at the bottom. No ceremony.

**What to build:**

When `match.result` is set AND `match.duel?.revealedRole === "flag"`, trigger a 900ms cinematic:

```tsx
const [showFlagCinematic, setShowFlagCinematic] = useState(false);

useEffect(() => {
  if (match?.result && match.duel?.revealedRole === "flag") {
    setShowFlagCinematic(true);
    setTimeout(() => setShowFlagCinematic(false), 900);
  }
}, [match?.result]);
```

```tsx
{showFlagCinematic && (
  <div className="board-end-overlay">
    <div className="flag-death-text">
      {match.result?.winner === viewerOwner ? "🚩 FLAG CAPTURED" : "🚩 YOUR FLAG FELL"}
    </div>
  </div>
)}
```

**CSS:**
```css
@keyframes boardDim {
  0%   { opacity: 0; backdrop-filter: blur(0px); }
  100% { opacity: 1; backdrop-filter: blur(3px); }
}

@keyframes flagDrop {
  0%   { opacity: 0; transform: translateY(-40px) scale(0.8); }
  60%  { opacity: 1; transform: translateY(5px) scale(1.06); }
  100% { opacity: 1; transform: translateY(0px) scale(1.0); }
}

.board-end-overlay {
  position: absolute;
  inset: 0;
  border-radius: 28px;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: boardDim 250ms ease forwards;
  z-index: 8;
  pointer-events: none;
}

.flag-death-text {
  font-family: var(--font-heading);
  font-size: clamp(1.6rem, 4vw, 2.8rem);
  color: var(--color-secondary);
  letter-spacing: 0.15em;
  text-shadow: 0 0 30px rgba(242, 207, 136, 0.8);
  animation: flagDrop 350ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
}
```

**Acceptance:** Flag dies → board dims → "🚩 FLAG CAPTURED" drops in from top → holds for 900ms → result panel appears. This is the climax. Make it land.

---

### VM-12 — Reveal phase timer urgency
**File:** `frontend/modules/game/src/components/GameScreen.tsx` + `frontend/app/src/styles.css`
**Complexity:** S
**Priority:** 🟡 HIGH

**Current state:** The reveal timer shows a number and a progress bar. No color change, no urgency as time runs out.

**CSS to add:**
```css
@keyframes timerUrgent {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.65; transform: scale(1.08); }
}

.reveal-timer--urgent {
  color: #fb7185 !important;
  animation: timerUrgent 0.6s ease-in-out infinite;
}
```

**In `GameScreen.tsx`**, where `revealSecondsLeft` is displayed:
```tsx
// Apply dynamic color to the meter fill:
const timerColor =
  revealSecondsLeft > 7 ? "var(--color-timer-fill)"
  : revealSecondsLeft > 3 ? "#fdba74"
  : "#fb7185";

// Apply urgent class to the number:
<strong className={revealSecondsLeft <= 3 ? "reveal-timer--urgent" : ""}>
  {revealSecondsLeft}s
</strong>

// Meter fill color:
<span className="reveal-meter__fill"
  style={{ width: `${(revealSecondsLeft / 10) * 100}%`, background: timerColor }} />
```

**Also add tick sounds** in `useAudio.ts`: when `revealSecondsLeft <= 3` and phase is `"reveal"`, play `playTone(600, 80)` once per second. Guard with a ref so it doesn't re-fire.

**Acceptance:** Timer turns orange at 7s, red at 3s, number pulses urgently. Player feels the pressure.

---

### VM-13 — Weapons-hide simultaneous fade (reveal end)
**File:** `frontend/modules/game/src/components/UnitSprite.tsx`
**Complexity:** S
**Priority:** 🟡 HIGH

**Current state:** When reveal ends, enemy pieces instantly become silhouettes. Weapons don't animate hiding.

**CSS to add:**
```css
@keyframes weaponHide {
  0%   { opacity: 1; transform: scale(1) translateX(0); }
  50%  { transform: scale(0.7) translateX(6px); }
  100% { opacity: 0; transform: scale(0.3) translateX(14px); }
}

.weapon-hiding {
  animation: weaponHide 400ms ease-in forwards;
}
```

**In `UnitSprite.tsx`**, track a `justHidden` prop (passed from `GameScreen`):
- `justHidden = true` for 500ms after reveal completes
- While `justHidden`: apply `.weapon-hiding` to the weapon icon `<img>`
- Apply `filter: brightness(0.55) saturate(0.3)` with `transition: filter 400ms ease-in-out` to the character image

**In `GameScreen.tsx`**: When phase transitions from `"reveal"` to `"player_turn"`, set `justHidden = true` for all enemy pieces for 500ms.

**Acceptance:** At T=0, all 10 enemy weapons pull behind the character simultaneously. Smooth 400ms fade. Feels deliberate, not an instant pop.

---

### VM-14 — Decoy shield pulse
**File:** `frontend/modules/game/src/components/DuelOverlay.tsx`
**Complexity:** S
**Priority:** 🟢 NICE-TO-HAVE

**Current state:** When Decoy absorbs an attack, `DuelOverlay` shows static text "Decoy - target is invulnerable". No visual impact.

**CSS to add:**
```css
@keyframes decoyShield {
  0%   { box-shadow: 0 0 0 0px rgba(213, 164, 255, 0.9);  }
  40%  { box-shadow: 0 0 0 20px rgba(213, 164, 255, 0.0); transform: scale(1.18); }
  100% { box-shadow: 0 0 0 0px rgba(213, 164, 255, 0.0);  transform: scale(1.0); }
}

.decoy-shield-pulse {
  animation: decoyShield 500ms ease-out;
  border-radius: 50%;
}
```

**In `DuelOverlay.tsx`**, when `duel.decoyAbsorbed === true`:
- Wrap the defender WeaponCard in a `.decoy-shield-pulse` div
- Replace static text with: `"🎭 DECOY — INVULNERABLE"` in `var(--color-decoy)`, `1.4rem`

**Acceptance:** Purple ring expands from Decoy, fades out. Text is clear and colored. Player immediately knows what happened.

---

### VM-15 — AI thinking indicator
**File:** `frontend/modules/game/src/components/GameScreen.tsx`
**Complexity:** S
**Priority:** 🟡 HIGH

**Current state:** During `ai_turn`, the header shows static text from `match.message`. No visual indicator Claude is computing.

**CSS to add:**
```css
@keyframes thinkDot {
  0%, 60%, 100% { opacity: 0.15; transform: translateY(0); }
  30%            { opacity: 1;    transform: translateY(-3px); }
}

.think-dot:nth-child(1) { animation: thinkDot 0.9s 0.0s infinite; }
.think-dot:nth-child(2) { animation: thinkDot 0.9s 0.2s infinite; }
.think-dot:nth-child(3) { animation: thinkDot 0.9s 0.4s infinite; }

.thinking-indicator {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: var(--color-label-cpu);
  font-size: 1.1rem;
  vertical-align: middle;
  margin-left: 8px;
}
```

**In `GameScreen.tsx`**, when `match.phase === "ai_turn"`:
```tsx
<span className="thinking-indicator">
  <span className="think-dot">•</span>
  <span className="think-dot">•</span>
  <span className="think-dot">•</span>
</span>
```

**Acceptance:** Three dots bounce in sequence next to "Claude thinking" text. Unmistakably "AI is working". Stops the moment AI turn ends.

---

## Dependency order

```
VM-01 (sound wiring) ──► VM-02 (weapon sounds)
VM-03 (idle sway)    ──► VM-04 (selection bounce) — both touch UnitSprite
VM-05 (wind-up)      ──► VM-06 (winner/loser) ──► VM-07 (reactions) — all DuelOverlay
VM-08 (land bounce)  — independent
VM-09 (death pose)   ──► VM-10 (role badge) — death before badge
VM-11 (flag cinematic) — depends on match.result flowing correctly (Sprint 02 B1)
VM-12 (timer urgency) ──► VM-02 (tick sounds share the useAudio hook)
VM-13 (weapons hide) — independent
VM-14 (decoy shield) — independent
VM-15 (AI dots)      — independent
```

**Start today in parallel:**
- DEV A: VM-01 → VM-02 (sound wiring)
- DEV B: VM-05 → VM-06 → VM-07 (duel sequence, most impactful)
- DEV C: VM-03 → VM-04 (unit feel)
- DEV D: VM-09 → VM-10 → VM-11 (death + cinematic)

---

## Release blockers (nothing ships without these)

- [ ] VM-01: Sounds actually play (turn, win/lose)
- [ ] VM-02: Rock/paper/scissors sounds fire on weapon throw
- [ ] VM-05: Wind-up → throw → result sequence plays (ICQ beat map)
- [ ] VM-06: Winner flashes gold, loser greyscale shrinks
- [ ] VM-11: Flag death cinematic plays before result panel
- [ ] All animations use CSS variables only (no hardcoded hex colors)
- [ ] All animations have `prefers-reduced-motion` override
- [ ] No layout shift (only `transform` and `opacity`)
- [ ] Vitest render tests still pass

## Nice-to-have (ship if time allows)

- [ ] VM-03: Idle sway on own pieces
- [ ] VM-07: Character win/lose/tie reactions
- [ ] VM-13: Weapons-hide simultaneous fade
- [ ] VM-14: Decoy shield pulse
- [ ] VM-15: AI thinking dots

---

## QA sign-off per task

| Task | What QA watches for |
|------|---------------------|
| VM-01 | Turn starts → sound fires. No double-fires. Audio mode "nothing" → silence. |
| VM-02 | Rock sounds like rock. Scissors snips. Attacker fires first, defender 50ms later. |
| VM-03 | Own pieces sway 2px max. Enemy pieces still. Selected piece stops swaying. |
| VM-04 | Selection bounce overshoots then settles. Not a snap. Gold glow appears. |
| VM-05 | Wind-up visible for 300ms before weapons appear. Both characters lean. |
| VM-06 | Winner flash and loser shrink both play. Tie shakes the `=` divider. |
| VM-07 | Winner bounces twice. Loser slumps/shakes. Tie — both shrug. |
| VM-08 | Piece lands with a micro-bounce. Walk runs ≥300ms. No teleportation. |
| VM-09 | Fallen image shown before fade. Red cell glow after death. |
| VM-10 | 🚩 or 🎭 appears in dead piece cell. Bounces in. Stays all match. |
| VM-11 | Board dims → flag text drops in → holds → result panel fades in. 900ms total. |
| VM-12 | Timer orange at 7s, red at 3s, number pulses. Tick sounds at ≤3s. |
| VM-13 | All 10 enemy weapons hide simultaneously. Not one-by-one. Smooth 400ms. |
| VM-14 | Purple ring expands from Decoy on absorption. Clear "🎭 INVULNERABLE" text. |
| VM-15 | Three dots bounce in sequence during AI turn. Stop immediately on resolution. |
