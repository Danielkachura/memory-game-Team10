# Sprint 02 — Code Review
# Squad RPS — Team 10
# Reviewer: CTO
# Framework: Good / Bad / Ugly
# Files reviewed: GameScreen.tsx, DuelOverlay.tsx, UnitSprite.tsx, Sidebar.tsx,
#                 StartScreen.tsx, useAudio.ts, useGame.ts, app.py, test_app.py

---

## VERDICT SUMMARY

| Area | Rating | Worst offender |
|------|--------|----------------|
| Component architecture | ⚠️ Bad | `GameScreen.tsx` — 380 lines, owns too much |
| Error handling | 🔴 Ugly | `useAudio.ts` leaks timers; `StartScreen` has `any` on critical prop |
| TypeScript types | ⚠️ Bad | `StartScreen.onSelect: any`; `PLAYER_IMG` uses `Record<string, string>` not `Record<Weapon, string>` |
| Test quality | ✅ Good | Backend tests are specific and meaningful; missing turn-timer tests |

---

## ✅ GOOD — What is done well

### 1. Backend tests are concrete and cover real edge cases

`test_app.py` is a genuine test suite, not a happy-path checkbox.

- `test_fifth_consecutive_tie_forces_resolution` — correctly patches `random.choice` with a `side_effect` list to simulate 5 ties, then asserts the phase exits `repick`, `pending_repick` is `None`, and the event log contains the forced resolution message. This is the right level of specificity.
- `test_tie_repick_does_not_change_canonical_weapons` — tests the exact bug that caused wrong outcomes in Sprint 01. Asserts that piece `weapon` fields are unchanged after a repick, and that `duel.attackerWeapon` reflects the repick choice not the canonical weapon. Excellent.
- `test_lone_enemy_decoy_becomes_killable_after_stalemate` — sets up state manually, attacks, and asserts `decoy_stalemate` is True AND the decoy is dead. Two assertions for one scenario — correct.
- `test_hidden_info_regression_for_roles_and_silhouettes` — asserts all five hidden fields (`weapon`, `weaponIcon`, `role`, `roleIcon`, `silhouette`) in one test. This is the regression guard that was missing from Sprint 01.
- `test_player_move_into_enemy_square_is_rejected` — asserts the HTTP 400 AND checks `"occupied"` in the response text. Not just status code.

### 2. `DuelOverlay.tsx` — BUG-1 from Sprint 01 is fixed correctly

`DuelSummary` interface now includes `attackerId: string` and `defenderId: string`. The `getWeaponImg` function correctly calls `unitId.startsWith("player")` with a typed string. The runtime crash is gone.

### 3. `useGame.ts` — `turnSecondsLeft` is server-authoritative

The turn countdown derives from `match.turnEndsAt` (a Unix timestamp from the server), not from a client-side `setInterval` counter. This is the correct architecture: the client can never drift ahead of the server's notion of when the turn ends. The fallback poll on timeout expiry is also correctly implemented.

### 4. `UnitSprite.tsx` — animation class composition is clean

```tsx
const className = [
  isDying ? "piece-dying" : "",
  selected ? "unit-selected" : "",
  isLanding ? "unit-landing" : "",
  !isDying && !isMoving && !selected && piece.owner === "player" && piece.alive ? "unit-idle-sway" : "",
].filter(Boolean).join(" ");
```
The guard conditions are mutually exclusive and correct: idle sway stops when selected, landing, moving, or dead. No animation class conflicts.

### 5. `app.py` — `check_and_apply_turn_timeout` is called on GET

```python
@app.get("/api/match/{match_id}")
def get_match(...):
    check_and_apply_turn_timeout(match_state)
    return build_player_view(match_state, viewer)
```
This means PVP polling clients pick up skipped turns automatically without needing a separate endpoint. The turn skip is enforced lazily on read, which is the right tradeoff for a single-session in-memory server.

### 6. `Sidebar.tsx` — subcomponents are small and typed

`TeamCount`, `StatRow`, `DuelLogEntry`, `RevealTimer`, `YinYangCircle` — each is a focused function with typed props. None of them have side effects. All are pure display components. This is the correct component size for UI leaf nodes.

---

## ⚠️ BAD — What needs improvement before the next sprint

### 1. `GameScreen.tsx` is 380 lines and owns too much state

`GameScreen` manages:
- `visibleDuelKey` (duel visibility logic)
- `landingPieceId` (animation state)
- `movingPieceId` (animation state)
- `echoCells` (death animation state)
- `showFlagCinematic` (result animation state)
- `justHiddenEnemyWeapons` (reveal transition state)
- `previousPositionsRef` (movement detection)
- `previousAliveRef` (death detection)
- `previousPhaseRef` (phase transition detection)
- `showDebugLog` (settings state)
- All board rendering JSX (300+ lines)

**The problem:** All animation state and detection logic is inlined inside `GameScreen`. If any animation breaks, the developer has to navigate 380 lines of mixed JSX and effect logic to find it.

**Fix:** Extract a `useBoardAnimations` hook that owns `landingPieceId`, `movingPieceId`, `echoCells`, `justHiddenEnemyWeapons`, `previousPositionsRef`, `previousAliveRef`, and the three `useEffect`s that drive them. `GameScreen` receives animation state as values and passes them to `UnitSprite`.

```ts
// Target interface:
const { landingPieceId, movingPieceId, echoCells, justHiddenEnemyWeapons } = useBoardAnimations(match);
```

This is a 2–3 hour refactor that will pay off every time VFX work touches animation state.

### 2. `useAudio.ts` — timer leak in the `showDuel` branch

```ts
if (state.showDuel && state.duel?.attackerWeapon) {
  const timer = window.setTimeout(() => { ... }, 300);

  if (state.duel.winner === "attacker" && ...) {
    window.setTimeout(() => playSound("jump.wav.mp4", 0.8), 450);  // ← NOT cleaned up
  }
  if (state.duel.tie) {
    playSound("shuffle.wav.mp4", 0.7);
  }

  return () => window.clearTimeout(timer);  // ← only cleans up the 300ms timer
}
```

The 450ms `jump` timer is created unconditionally inside the effect but is **not returned in the cleanup**. If the component unmounts between 300ms and 450ms — for example if the match ends during the duel — the sound fires on an unmounted component. In jsdom this is a silent error; in the browser it is an AudioContext operation on a potentially garbage-collected state.

**Fix:**
```ts
const timers: ReturnType<typeof window.setTimeout>[] = [];
timers.push(window.setTimeout(() => { ... }, 300));
if (attackerWon) timers.push(window.setTimeout(() => playSound("jump.wav.mp4", 0.8), 450));
return () => timers.forEach(window.clearTimeout);
```

### 3. `PLAYER_IMG` in `UnitSprite.tsx` — scissors is still wrong

```ts
const PLAYER_IMG: Record<string, string> = {
  rock: "/character_red_rock_nobg.png",
  paper: "/character_red_paper_nobg.png",
  scissors: "/logo_rps_online_nobg.png",  // ← STILL WRONG after Sprint 02
  ...
};
```

This was `BUG-VM-00` in the visuals todo. `character_red_scissors_nobg.png` exists in `/public` and was confirmed in the asset audit. The dev who fixed DuelOverlay did not fix this. Every match where the player holds scissors shows the RPS logo instead of the character. This is visible to the demo judge.

**Fix — 1 line:**
```ts
scissors: "/character_red_scissors_nobg.png",
```

Also: `PLAYER_IMG` is typed as `Record<string, string>` not `Record<Weapon, string>`. This means TypeScript will not catch a missing weapon key. Change the type.

### 4. `buildDuelKey` includes `revealedRole` but `DuelSummary.revealedRole` can be undefined

```ts
function buildDuelKey(match: MatchView | null) {
  return [
    ...
    duel.revealedRole ?? "",  // ← correct nullish coalescing
  ].join("|");
}
```

This is fine as written. But `DuelSummary.revealedRole` is typed as `"soldier" | "flag" | "decoy" | undefined` in `DuelOverlay.tsx` but as just `string | undefined` (implicitly, via `revealedRole?: string`) in `useGame.ts`'s `DuelSummary` interface. These two interfaces are not the same type and are not shared. If a new role is added to the backend, one interface will drift from the other.

**Fix:** Define `DuelSummary` once in `shared/types/game.ts` and import it in both `DuelOverlay.tsx` and `useGame.ts`. Do not duplicate interface definitions across files.

### 5. `Sidebar.tsx` — `REVEAL_DURATION_SECONDS = 10` is a hardcoded constant

```ts
const REVEAL_DURATION_SECONDS = 10;
// Used for: const pct = (seconds / REVEAL_DURATION_SECONDS) * 100;
```

The server now sends `match.turnSeconds` and `revealEndsAt` dynamically (reveal duration is tunable per PRD §9). If the CTO changes the reveal to 15s for playtesting, `Sidebar`'s progress bar will max out at 67% instead of 100%.

**Fix:** Pass the actual reveal duration from `match.revealEndsAt - match.stats.durationSeconds` or add a `revealSeconds` field to `MatchView`. Use it in `RevealTimer`.

### 6. Test coverage gap — turn timer behaviour is untested

`test_app.py` has 13 tests. Zero of them test the 10-second turn timer:
- No test for `check_and_apply_turn_timeout` returning True when `turn_ends_at` is in the past
- No test that a GET after timeout skips the turn
- No test that `turn_ends_at` is set when reveal completes
- No test that `turn_ends_at` resets after each move

The turn timer is a PRD-required feature that was just implemented. It has no test coverage. This is a regression risk.

**Minimum required tests:**
```python
def test_turn_timer_skips_player_turn_on_get_after_expiry(self): ...
def test_turn_ends_at_is_set_after_reveal_complete(self): ...
def test_turn_ends_at_resets_after_player_move(self): ...
def test_turn_timeout_during_repick_cancels_pending_duel(self): ...
```

---

## 🔴 UGLY — Must fix before shipping

### 1. `StartScreen.tsx` — `onSelect: (difficulty: any) => void`

```tsx
interface StartScreenProps {
  difficulties: Array<{ id: string; label: string; detail: string }>;
  selected: string;
  onSelect: (difficulty: any) => void;  // ← any in a typed callback
  onStart: () => void;
  loading: boolean;
}
```

`any` on a callback prop disables TypeScript for the entire call chain. A developer can call `onSelect(42)` or `onSelect({})` and TypeScript will not complain. This is on the entry point of the game — the screen the judge sees first.

The correct type is `(difficulty: Difficulty) => void`. Import `Difficulty` from `useGame.ts` or `shared/types/game.ts`.

**Fix:**
```tsx
import type { Difficulty } from "../hooks/useGame";

interface StartScreenProps {
  onSelect: (difficulty: Difficulty) => void;
  selected: Difficulty;  // also: `string` is too wide here
  ...
}
```

This is a 2-line change. There is no reason this shipped with `any`.

### 2. `DuelOverlay.tsx` — two `data-testid="revealed-role-banner"` on different elements

```tsx
{duel.revealedRole === "flag" ? (
  <div data-testid="revealed-role-banner" ...>FLAG CAPTURED</div>
) : null}
{duel.revealedRole === "decoy" ? (
  <div data-testid="revealed-role-banner" ...>DECOY - INVULNERABLE</div>
) : null}
```

Both elements share the same `testId`. In a Vitest/Testing Library query, `getByTestId("revealed-role-banner")` will throw if both are rendered simultaneously (they can't be, logically, but the selector contract is violated). In Playwright, `page.locator('[data-testid="revealed-role-banner"]')` would match both if both somehow render.

More importantly, any test that asserts on the banner text cannot distinguish between flag and decoy without an additional selector.

**Fix:**
```tsx
data-testid="revealed-role-banner-flag"
data-testid="revealed-role-banner-decoy"
```

### 3. `useAudio.ts` — `revealSecondsLeft` in the signature hash causes excessive re-renders

```ts
const signature = [
  ...
  state.revealSecondsLeft ?? "no-reveal-timer",  // ← changes every 250ms
].join("|");
```

`useAudio` is called from `GameScreen` with `revealSecondsLeft` from `useGame`. The reveal timer ticks every 250ms. This means `useAudio`'s effect runs and evaluates the signature every 250ms during the entire reveal phase — 40 evaluations over 10 seconds. The `playTone` tick guard (`lastTickRef`) prevents double-playing, but the effect still runs 40 times when it should run ~3 times (at 3, 2, 1 seconds).

**Fix:** Remove `revealSecondsLeft` from the signature hash. Handle it in a separate `useEffect` inside `useAudio` with its own dedicated dependency:

```ts
// Separate effect for reveal ticks — runs only when revealSecondsLeft changes
useEffect(() => {
  if (state?.phase !== "reveal") return;
  if (!state.revealSecondsLeft || state.revealSecondsLeft > 3) return;
  playTone(600, 80);
}, [state?.revealSecondsLeft]);
```

This reduces the effect from 40 evaluations to 3.

### 4. `GameScreen.tsx` — `cell.piece!` non-null assertion in JSX

```tsx
onClick={() => onPieceClick(cell.piece!)}
```

This is inside a branch that checks `cell.piece ? (...)`, so at runtime it is safe. But the `!` assertion disables TypeScript's null check for that expression. If someone refactors the conditional block and the `cell.piece` check is removed, this becomes a runtime crash with no compile-time warning.

**Fix:**
```tsx
onClick={() => { if (cell.piece) onPieceClick(cell.piece); }}
```
Or extract into a named handler that TypeScript narrows correctly.

### 5. `test_player_move_into_enemy_square_is_rejected` — tests the wrong field name

```python
response = self.client.post(
    f"/api/match/{match_id}/turn/player-move",
    json={"pieceId": player_piece["id"], "targetRow": 4, "targetCol": 3},
)
self.assertEqual(response.status_code, 400)
self.assertIn("occupied", response.text.lower())
```

The `PlayerMoveRequest` schema uses `AliasChoices("row", "targetRow")` and `AliasChoices("col", "targetCol")`. The test sends `targetRow`/`targetCol` which are accepted. But the actual Pydantic validation error for a missing `row`/`col` would return a 422, not a 400. The test asserts 400 and gets it — but only because the destination is occupied, not because of a validation error. If the cell were empty, the response would be 200 (success), not the 400 the test implies is about validation.

This test is testing the right behavior (occupied cell rejected) but the assertion message "occupied" is in the response and the test passes, masking that the test name says "enemy square" when it's actually testing an occupied cell regardless of owner.

**More precise version:**
```python
def test_player_cannot_move_into_occupied_cell(self): ...
def test_player_cannot_move_to_non_adjacent_cell(self): ...  # this case has NO test at all
```

---

## Sprint 02 sign-off status

| Item | Status |
|------|--------|
| BUG-1 DuelOverlay crash | ✅ Fixed |
| BUG-3 dead piece role reveal | ✅ Fixed (B1 done) |
| Decoy stalemate | ✅ Implemented and tested |
| Tie cap | ✅ Implemented and tested |
| Hidden-info regression test | ✅ Added |
| CORS restored | ✅ Fixed |
| Turn timer (new feature) | ✅ Implemented — ❌ UNTESTED |
| `StartScreen.onSelect: any` | 🔴 Not fixed |
| `scissors` wrong image | 🔴 Not fixed |
| `DuelSummary` duplicated interface | ⚠️ Not fixed |
| Timer leak in `useAudio` | ⚠️ Not fixed |
| `GameScreen` size | ⚠️ Not refactored |

**Merge decision: CONDITIONAL.**
Fix the two 🔴 items (StartScreen `any`, scissors image) before the sprint is closed.
The ⚠️ items are tracked for Sprint 03.
