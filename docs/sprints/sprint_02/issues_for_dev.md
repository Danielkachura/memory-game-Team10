# Sprint 02 — Issues for Dev Team
# Squad RPS — Team 10
# Author: CTO
# Paste this into Codex: Use $memory-game-dev-frontend at .codex/skills/memory-game-dev-frontend to fix all issues listed in this file.

---

## ⚠️ BAD — Fix before Sprint 03

---

### BAD-1 · `GameScreen.tsx` is too large

**File:** `frontend/modules/game/src/components/GameScreen.tsx`

`GameScreen` is 380 lines. It manages 9 state variables, 6 refs, and 5 effects — all mixed together with 300 lines of JSX. All animation state (`landingPieceId`, `movingPieceId`, `echoCells`, `justHiddenEnemyWeapons`) and the three `useEffect`s that drive them live directly inside the screen component. When any animation breaks, a developer has to search through the entire file to find it.

**Required fix:** Extract a `useBoardAnimations` hook.

```ts
// New file: frontend/modules/game/src/hooks/useBoardAnimations.ts
export function useBoardAnimations(match: MatchView | null) {
  // owns: landingPieceId, movingPieceId, echoCells,
  //       justHiddenEnemyWeapons, previousPositionsRef,
  //       previousAliveRef, previousPhaseRef
  // owns: the three useEffects that detect movement, death, phase transitions
  return { landingPieceId, movingPieceId, echoCells, justHiddenEnemyWeapons };
}
```

`GameScreen` calls the hook and passes the returned values down to `UnitSprite`. No logic change — just extraction.

---

### BAD-2 · `useAudio.ts` leaks a timer

**File:** `frontend/modules/game/src/hooks/useAudio.ts`

Inside the `showDuel` branch, two `setTimeout` calls are created but only one is cleaned up:

```ts
// Current code — BAD:
const timer = window.setTimeout(() => { /* weapon sounds */ }, 300);

window.setTimeout(           // ← this one is NEVER cleaned up
  () => playSound("jump.wav.mp4", 0.8),
  450
);

return () => window.clearTimeout(timer);  // ← only cleans the 300ms one
```

If the component unmounts between 300ms and 450ms (for example, when the match ends mid-duel), the 450ms timer fires on a dead component.

**Required fix:** Collect all timers and clean them all up.

```ts
// Fixed:
const timers: ReturnType<typeof window.setTimeout>[] = [];

timers.push(window.setTimeout(() => { /* weapon sounds */ }, 300));
timers.push(window.setTimeout(() => playSound("jump.wav.mp4", 0.8), 450));

return () => timers.forEach(window.clearTimeout);
```

---

### BAD-3 · `PLAYER_IMG` in `UnitSprite.tsx` uses a type that is too wide

**File:** `frontend/modules/game/src/components/UnitSprite.tsx`

```ts
// Current — BAD:
const PLAYER_IMG: Record<string, string> = { ... };
```

`Record<string, string>` accepts any string key. TypeScript will not warn if a weapon key is missing or misspelled. The correct type is `Record<Weapon, string>`, which forces all three weapons to be present and rejects unknown keys.

**Required fix:**

```ts
import type { Weapon } from "../hooks/useGame";

const PLAYER_IMG: Record<Weapon, string> = {
  rock: "/character_red_rock_nobg.png",
  paper: "/character_red_paper_nobg.png",
  scissors: "/character_red_scissors_nobg.png",
};
```

Apply the same fix to `CPU_IMG`.

---

### BAD-4 · `Sidebar.tsx` hardcodes the reveal duration

**File:** `frontend/modules/game/src/components/Sidebar.tsx`

```ts
// Current — BAD:
const REVEAL_DURATION_SECONDS = 10;
const pct = (seconds / REVEAL_DURATION_SECONDS) * 100;
```

The reveal duration is a tunable constant on the server (PRD §9 explicitly flags it as likely to change to 15 seconds after playtesting). The server already sends `revealEndsAt` in the match payload. If the CTO sets the reveal to 15 seconds, the progress bar in `Sidebar` will stop at 67% instead of 100%.

**Required fix:** Add `revealSeconds` to the `SidebarProps` interface and pass the actual value from the match. In `GameScreen`, compute it as:

```ts
const revealSeconds = match
  ? Math.round(match.revealEndsAt - match.stats.durationSeconds + match.stats.durationSeconds)
  : 10;
// Simpler: pass (match.revealEndsAt - match.started_at) if the field is added to MatchView,
// or use a constant imported from a shared config file.
```

The cleanest solution is to add `revealSeconds: number` to `MatchView` and have the server send it. For now, accept it as a prop with default 10.

---

### BAD-5 · Turn timer has zero test coverage

**File:** `backend/python_api/tests/test_app.py`

The 10-second turn timer was implemented in this sprint and is a PRD-required feature. There are 13 tests in `test_app.py`. None of them cover the turn timer. The following scenarios have no test:

- `turn_ends_at` is set after reveal completes
- A player action submitted after `turn_ends_at` is in the past results in a turn skip, not a normal move
- A GET request after expiry applies the skip and returns the updated turn owner
- `turn_ends_at` resets after a successful player move
- A timeout during repick cancels the pending duel and passes the turn

**Required fix:** Add these four tests as a minimum:

```python
def test_turn_ends_at_is_set_after_reveal_complete(self): ...
def test_turn_timer_skips_player_turn_on_expired_attack(self): ...
def test_turn_ends_at_resets_after_player_move(self): ...
def test_turn_timeout_during_repick_cancels_pending_duel(self): ...
```

Each test must manipulate `match_state["turn_ends_at"]` directly to simulate expiry, then assert the phase and `current_turn` have changed to the opponent.

---

## 🔴 UGLY — Fix before merging to main

---

### UGLY-1 · `StartScreen.tsx` uses `any` on a callback prop

**File:** `frontend/modules/game/src/components/StartScreen.tsx`

```tsx
// Current — UGLY:
interface StartScreenProps {
  selected: string;
  onSelect: (difficulty: any) => void;
}
```

`any` on a callback prop disables TypeScript for the entire call chain. A developer can call `onSelect(42)`, `onSelect(null)`, or `onSelect("invalid")` and TypeScript will not complain. This is the first screen the demo judge interacts with.

**Required fix — 2 lines:**

```tsx
import type { Difficulty } from "../hooks/useGame";

interface StartScreenProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  difficulties: Array<{ id: Difficulty; label: string; detail: string }>;
  onStart: () => void;
  loading: boolean;
}
```

There is no acceptable reason this was shipped with `any`.

---

### UGLY-2 · `UnitSprite.tsx` shows the wrong image for scissors

**File:** `frontend/modules/game/src/components/UnitSprite.tsx`

```ts
// Current — UGLY:
const PLAYER_IMG: Record<string, string> = {
  rock: "/character_red_rock_nobg.png",
  paper: "/character_red_paper_nobg.png",
  scissors: "/logo_rps_online_nobg.png",   // ← WRONG. Shows the site logo.
};
```

`character_red_scissors_nobg.png` exists in `/public` and was confirmed in the asset audit in Sprint 02. This was filed as `BUG-VM-00` in `visuals_motion_todo.md` and was not fixed. Every match where the player holds scissors shows the RPS site logo instead of the character sprite.

**Required fix — 1 line:**

```ts
scissors: "/character_red_scissors_nobg.png",
```

---

### UGLY-3 · `DuelOverlay.tsx` has two elements with the same `data-testid`

**File:** `frontend/modules/game/src/components/DuelOverlay.tsx`

```tsx
// Current — UGLY:
{duel.revealedRole === "flag" ? (
  <div data-testid="revealed-role-banner">FLAG CAPTURED - MATCH OVER</div>
) : null}

{duel.revealedRole === "decoy" ? (
  <div data-testid="revealed-role-banner">DECOY - INVULNERABLE</div>
) : null}
```

Both elements share the same `data-testid`. `getByTestId("revealed-role-banner")` in Vitest will throw a "found multiple elements" error if both render. In Playwright, `page.locator('[data-testid="revealed-role-banner"]')` cannot distinguish between flag and decoy without an extra filter. Any test that asserts on which role was revealed is broken by this ambiguity.

**Required fix:**

```tsx
{duel.revealedRole === "flag" ? (
  <div data-testid="revealed-role-banner-flag">FLAG CAPTURED - MATCH OVER</div>
) : null}

{duel.revealedRole === "decoy" ? (
  <div data-testid="revealed-role-banner-decoy">DECOY - INVULNERABLE</div>
) : null}
```

---

### UGLY-4 · `GameScreen.tsx` uses a non-null assertion without narrowing

**File:** `frontend/modules/game/src/components/GameScreen.tsx`

```tsx
// Current — UGLY:
onClick={() => onPieceClick(cell.piece!)}
```

This line is inside a `{cell.piece ? (...) : (...)}` branch, so at runtime `cell.piece` is never null here. However, the `!` operator disables TypeScript's null check for that expression permanently. If someone refactors the surrounding conditional — moving JSX, flattening branches, or extracting a subcomponent — TypeScript will not warn that the null check has been removed. The result is a silent runtime crash.

**Required fix:**

```tsx
onClick={() => { if (cell.piece) onPieceClick(cell.piece); }}
```

TypeScript narrows `cell.piece` to non-null inside the `if` block. No assertion needed.

---

## Fix Priority Order

| # | Issue | File | Size | Block |
|---|-------|------|------|-------|
| 1 | UGLY-2 scissors wrong image | `UnitSprite.tsx` | 1 line | Demo |
| 2 | UGLY-1 `any` on callback | `StartScreen.tsx` | 2 lines | Merge |
| 3 | UGLY-3 duplicate testId | `DuelOverlay.tsx` | 2 lines | Merge |
| 4 | UGLY-4 non-null assertion | `GameScreen.tsx` | 1 line | Merge |
| 5 | BAD-3 `PLAYER_IMG` type | `UnitSprite.tsx` | 3 lines | Sprint 03 |
| 6 | BAD-2 timer leak | `useAudio.ts` | 5 lines | Sprint 03 |
| 7 | BAD-5 timer tests | `test_app.py` | 4 new tests | Sprint 03 |
| 8 | BAD-4 hardcoded duration | `Sidebar.tsx` | props change | Sprint 03 |
| 9 | BAD-1 extract hook | `GameScreen.tsx` | 2–3 hour refactor | Sprint 03 |
