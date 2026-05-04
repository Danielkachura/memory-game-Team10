# Sprint 2 — Dev TODO
**Squad RPS - Team 10**

**Sprint Goal:** Fix critical bugs blocking demo, improve test coverage, stabilize core gameplay loop

**Timeline:** Immediate (Pre-Demo Sprint)  
**Owner:** [DEV]  
**Reviewed by:** [CTO]

---

## 🔴 P0 — Critical Fixes (BLOCKING DEMO)
**Estimated:** 2-4 hours total  
**Must complete before demo**

### 1. Fix Dead Piece Role Leak [CRITICAL] [S]
**File:** `backend/python_api/app.py` line 251  
**Complexity:** Small (5 min)  
**Blocker:** Yes — Hidden-info security violation

**Current Code:**
```python
show_role = (is_owner and phase != "reveal") or (reveal_all and piece["role"] != "soldier")
```

**Fix:**
```python
show_role = (is_owner and phase != "reveal") or (reveal_all and piece["role"] != "soldier" and piece["alive"])
```

**Acceptance Criteria:**
- [ ] Dead enemy pieces do NOT show roles until match ends
- [ ] Alive enemy pieces still hidden during gameplay
- [ ] Own dead pieces show roles correctly
- [ ] Add unit test: `test_dead_enemy_role_stays_hidden_until_match_ends()`

**Test command:**
```bash
cd backend && pytest tests/test_app.py::PythonApiTests::test_dead_enemy_role_stays_hidden_until_match_ends -v
```

---

### 2. Fix PVP Token Validation [CRITICAL] [S]
**File:** `backend/python_api/app.py` line 273 (`viewer_for()`)  
**Complexity:** Small (10 min)  
**Blocker:** Yes — PVP security breach

**Current Code:**
```python
def viewer_for(match_state: dict[str, Any], token: Optional[str]) -> Owner:
    if match_state.get("mode", "ai") != "pvp":
        return "player"
    if not token:
        raise HTTPException(status_code=401, detail="Missing player token.")
    info = TOKENS.get(token)  # ← Missing validation here
    if not info or info["match_id"] != match_state["id"]:
        raise HTTPException(status_code=401, detail="Invalid player token.")
    return info["owner"]
```

**Fix:**
```python
def viewer_for(match_state: dict[str, Any], token: Optional[str]) -> Owner:
    if match_state.get("mode", "ai") != "pvp":
        return "player"
    if not token:
        raise HTTPException(status_code=401, detail="Missing player token.")
    if token not in TOKENS:  # ← ADD THIS CHECK
        raise HTTPException(status_code=401, detail="Invalid player token.")
    info = TOKENS.get(token)
    if not info or info["match_id"] != match_state["id"]:
        raise HTTPException(status_code=401, detail="Invalid player token.")
    return info["owner"]
```

**Acceptance Criteria:**
- [ ] Invalid token returns 401
- [ ] Expired token returns 401
- [ ] Valid token shows correct player view
- [ ] Add unit test: `test_pvp_invalid_token_rejected()`

**Test command:**
```bash
cd backend && pytest tests/test_app.py::PythonApiTests::test_pvp_invalid_token_rejected -v
```

---

### 3. Fix Reveal Timer Race Condition [HIGH] [S]
**File:** `frontend/modules/game/src/hooks/useGame.ts` lines 85-93  
**Complexity:** Small (15 min)  
**Blocker:** Yes — UI stuck if user refreshes during reveal

**Current Code:**
```typescript
useEffect(() => {
  if (!match || match.phase !== "reveal") {
    setRevealSecondsLeft(0);
    setRevealArmed(false);
    return undefined;
  }
  const tick = () => {
    const remaining = Math.max(0, Math.ceil(match.revealEndsAt - Date.now() / 1000));
    setRevealSecondsLeft(remaining);
    if (remaining > 0) {
      setRevealArmed(true);  // ← BUG: Only arms after first tick
    }
  };
  tick();
  const interval = window.setInterval(tick, 250);
  return () => window.clearInterval(interval);
}, [match]);
```

**Fix:**
```typescript
useEffect(() => {
  if (!match || match.phase !== "reveal") {
    setRevealSecondsLeft(0);
    setRevealArmed(false);
    return undefined;
  }
  setRevealArmed(true);  // ← FIX: Arm immediately when entering reveal phase
  const tick = () => {
    const remaining = Math.max(0, Math.ceil(match.revealEndsAt - Date.now() / 1000));
    setRevealSecondsLeft(remaining);
  };
  tick();
  const interval = window.setInterval(tick, 250);
  return () => window.clearInterval(interval);
}, [match]);
```

**Acceptance Criteria:**
- [ ] Timer fires even if page refreshed during reveal
- [ ] No infinite stuck state
- [ ] Reveal completes after 10 seconds consistently
- [ ] Add E2E test: `test_reveal_timer_survives_refresh()`

**Test command:**
```bash
npx playwright test tests/e2e/reveal-timer.spec.ts
```

---

### 4. Add Piece Ownership Validation [MEDIUM] [S]
**File:** `backend/python_api/app.py` line 720 (`player_attack()`)  
**Complexity:** Small (10 min)  
**Blocker:** No, but exploit allows cheating

**Current Code:**
```python
if attacker["owner"] != actor or defender["owner"] == actor:
    raise HTTPException(status_code=400, detail="Invalid attacker or target.")
```

**Fix:**
```python
# Solo mode: player can ONLY attack with their own pieces
if match_state.get("mode", "ai") == "ai" and attacker["owner"] != "player":
    raise HTTPException(status_code=400, detail="Cannot attack with AI pieces.")

# General validation
if attacker["owner"] != actor or defender["owner"] == actor:
    raise HTTPException(status_code=400, detail="Invalid attacker or target.")
```

**Acceptance Criteria:**
- [ ] Player cannot send `attackerId` of AI piece
- [ ] Returns 400 with clear error message
- [ ] PVP mode still works (both players can attack)
- [ ] Add unit test: `test_player_cannot_attack_with_ai_piece()`

**Test command:**
```bash
cd backend && pytest tests/test_app.py::PythonApiTests::test_player_cannot_attack_with_ai_piece -v
```

---

## 🟡 P1 — High Priority (This Week)
**Estimated:** 8-10 hours total

### 5. Expand Board to Fullscreen Layout [HIGH] [L]
**Files:** 
- `frontend/app/src/styles.css`
- `frontend/modules/game/src/components/GameScreen.tsx`

**Complexity:** Large (2-3 hours)  
**Priority:** High — Better demo experience

**Problem:**
Current board layout is constrained and doesn't use available screen space effectively. Board appears small on larger monitors, making it hard to see piece details during demo.

**Requirements:**
1. **Board scales to fill viewport** — Use available height/width
2. **Maintains aspect ratio** — 5×6 grid proportions preserved
3. **Responsive breakpoints:**
   - Desktop (≥1024px): Fullscreen board with sidebar
   - Tablet (768-1023px): Stacked layout (board on top, sidebar below)
   - Mobile (<768px): Single column, compact controls
4. **Readable on projector** — Minimum 60px cell size for demo visibility
5. **Preserves debug panel** — Collapsible, doesn't overlap board

**Design Approach:**

**Option A: CSS Grid Fullscreen (Recommended)**
```css
/* styles.css */
.squad-layout--boarded {
  display: grid;
  grid-template-columns: 1fr 360px; /* board | sidebar */
  grid-template-rows: auto 1fr;
  height: 100vh;
  gap: 1rem;
}

.nati-board-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0; /* Allow grid item to shrink */
}

.nati-board-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 8px;
  width: min(90vw, calc(100vh - 200px) * 5/6); /* Aspect ratio lock */
  height: min(90vh - 200px, calc(90vw * 6/5)); /* Inverse ratio */
}

.nati-board-cell {
  aspect-ratio: 1;
  min-width: 60px; /* Projector-readable */
  min-height: 60px;
}

@media (max-width: 1023px) {
  .squad-layout--boarded {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
  }
}
```

**Option B: Flexbox Adaptive**
```css
.squad-layout--boarded {
  display: flex;
  flex-direction: row;
  height: 100vh;
  overflow: hidden;
}

.nati-board-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.nati-sidebar-shell {
  width: 360px;
  flex-shrink: 0;
  overflow-y: auto;
}
```

**Implementation Steps:**

1. **Update CSS Layout** (45 min)
   - [ ] Add viewport-based sizing to `.squad-layout--boarded`
   - [ ] Scale `.nati-board-grid` with aspect ratio lock
   - [ ] Add responsive breakpoints (desktop, tablet, mobile)
   - [ ] Test on 1920×1080, 1366×768, iPad, mobile

2. **Adjust Component Structure** (30 min)
   - [ ] Move debug panel to collapsible sidebar section
   - [ ] Ensure HUD stays at top (fixed or sticky)
   - [ ] Result panel overlays board (modal style)

3. **Add Zoom Controls (Optional)** (45 min)
   - [ ] Add zoom in/out buttons (90%, 100%, 110%)
   - [ ] Persist zoom preference in localStorage
   - [ ] Keyboard shortcuts: `Ctrl +`, `Ctrl -`, `Ctrl 0`

4. **Accessibility & Polish** (30 min)
   - [ ] Ensure focus indicators visible at all sizes
   - [ ] Test with browser zoom (200%, 300%)
   - [ ] Verify text remains readable
   - [ ] Add CSS `@media (prefers-reduced-motion)` fallback

**Acceptance Criteria:**
- [ ] Board fills 80-90% of viewport height on desktop
- [ ] Cell size ≥60px on 1920×1080 screen
- [ ] Grid maintains 5×6 aspect ratio at all sizes
- [ ] Sidebar doesn't overlap board
- [ ] Works on Chrome, Firefox, Safari
- [ ] No horizontal scroll on any breakpoint
- [ ] Debug panel accessible (collapsible/expandable)
- [ ] Readable on 720p projector from 10 feet away

**Visual Reference:**
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Squad RPS - Team 10                        [Back]   │
├─────────────────────────────────────┬───────────────────────┤
│                                     │  Sidebar:             │
│                                     │  ┌─────────────────┐  │
│         5×6 Board Grid              │  │ Phase: reveal   │  │
│       (Fills viewport)              │  │ Turn: Player    │  │
│                                     │  └─────────────────┘  │
│   ┌──┬──┬──┬──┬──┐                 │                       │
│   │AI│AI│AI│AI│AI│  ← Row 6        │  Stats:               │
│   ├──┼──┼──┼──┼──┤                 │  - Duels: 0/0         │
│   │AI│AI│AI│AI│AI│  ← Row 5        │  - Ties: 0            │
│   ├──┼──┼──┼──┼──┤                 │                       │
│   │  │  │  │  │  │  ← Row 4        │  [Debug Log ▼]        │
│   ├──┼──┼──┼──┼──┤                 │                       │
│   │  │  │  │  │  │  ← Row 3        │                       │
│   ├──┼──┼──┼──┼──┤                 │                       │
│   │P1│P1│P1│P1│P1│  ← Row 2        │                       │
│   ├──┼──┼──┼──┼──┤                 │                       │
│   │P1│P1│P1│P1│P1│  ← Row 1        │                       │
│   └──┴──┴──┴──┴──┘                 │                       │
│                                     │                       │
└─────────────────────────────────────┴───────────────────────┘
```

**Testing:**
```bash
# Run dev server and test on multiple viewports
cd frontend/app && npm run dev

# Manual testing checklist:
# 1. Desktop (1920×1080): Board fills ~80% height
# 2. Laptop (1366×768): Board readable, no scroll
# 3. Tablet (iPad 1024×768): Sidebar below board
# 4. Mobile (375×667): Single column, compact
# 5. Projector simulation (720p): Cells ≥60px
```

**Risks:**
- **Aspect ratio distortion** — Test across screens to ensure 5:6 ratio maintained
- **Duel overlay positioning** — May need adjustment for fullscreen board
- **Debug panel accessibility** — Ensure still reachable when board is large

**Alternative (If time-constrained):**
Add simple CSS class `.fullscreen-mode` that user can toggle via button:
```typescript
const [fullscreen, setFullscreen] = useState(false);

<div className={`squad-layout ${fullscreen ? 'squad-layout--fullscreen' : ''}`}>
```

---

### 6. Fix CORS Configuration [MEDIUM] [S]
**File:** `backend/python_api/app.py` line 44  
**Complexity:** Small (5 min)  
**Security:** CSRF vulnerability

**Current Code:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Fix:**
```python
import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["content-type", "x-player-token"],
    allow_credentials=False,
)
```

**Acceptance Criteria:**
- [ ] Only localhost origins allowed in dev
- [ ] Can be configured via `.env` for deployment
- [ ] Requests from other origins return CORS error
- [ ] Add to README: CORS configuration instructions

---

### 6. Fix CORS Configuration [MEDIUM] [S]
**File:** `backend/python_api/app.py` line 44  
**Complexity:** Small (5 min)  
**Security:** CSRF vulnerability

**Current Code:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Fix:**
```python
import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:8000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["content-type", "x-player-token"],
    allow_credentials=False,
)
```

**Acceptance Criteria:**
- [ ] Only localhost origins allowed in dev
- [ ] Can be configured via `.env` for deployment
- [ ] Requests from other origins return CORS error
- [ ] Add to README: CORS configuration instructions

---

### 7. Add Test Coverage Reports [MEDIUM] [M]
**Files:** `backend/pytest.ini`, `frontend/app/vite.config.ts`  
**Complexity:** Medium (1 hour)

**Backend Setup:**
```bash
cd backend
pip install pytest-cov
```

Create `backend/pytest.ini`:
```ini
[pytest]
testpaths = python_api/tests
addopts = --cov=python_api --cov-report=html --cov-report=term-missing --cov-fail-under=80
```

**Frontend Setup:**
```bash
cd frontend/app
npm install --save-dev @vitest/coverage-v8
```

Update `frontend/app/vite.config.ts`:
```typescript
export default defineConfig({
  // ... existing config
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/'],
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    }
  }
})
```

**Acceptance Criteria:**
- [ ] `pytest --cov` generates HTML report in `backend/htmlcov/`
- [ ] `vitest --coverage` generates HTML report in `frontend/app/coverage/`
- [ ] Both reports show ≥80% coverage
- [ ] Add to README: how to run coverage reports
- [ ] CI fails if coverage drops below 80%

**Test commands:**
```bash
cd backend && pytest --cov=python_api --cov-report=html
cd frontend/app && npx vitest --coverage
```

---

### 8. Write Full-Match E2E Test [LARGE] [XL]
**File:** `tests/e2e/full-match.spec.ts`  
**Complexity:** X-Large (2-3 hours)

**Scenario:** Reveal → Move → Attack → Win

```typescript
test('complete match flow from reveal to victory', async ({ page }) => {
  // 1. Start match
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Match' }).click();
  
  // 2. Wait for reveal phase
  await expect(page.getByText(/Weapon Reveal/i)).toBeVisible();
  
  // 3. Force reveal completion via test helper
  await page.evaluate(() => {
    return (window as any).__SQUAD_RPS_TEST__?.finishReveal();
  });
  
  // 4. Verify player turn starts
  await expect(page.getByText(/Your turn/i)).toBeVisible();
  
  // 5. Select a player piece and move it
  await page.getByLabel(/Rock/).first().click();
  await page.getByLabel(/Empty cell row 3 col 1/).click();
  
  // 6. Wait for AI turn
  await expect(page.getByText(/AI Turn/i)).toBeVisible();
  await expect(page.getByText(/Your turn/i)).toBeVisible();
  
  // 7. Attack an adjacent enemy
  // ... (continue full flow)
  
  // 8. Verify victory screen
  await expect(page.getByTestId('result-panel')).toBeVisible();
  await expect(page.getByText(/Victory|Defeat/i)).toBeVisible();
});
```

**Acceptance Criteria:**
- [ ] Test covers: reveal, move, attack, duel, result
- [ ] Test passes consistently (run 5 times, all pass)
- [ ] Test runs in <30 seconds
- [ ] Add tie-repick scenario variant
- [ ] Add flag-capture scenario variant

**Test command:**
```bash
npx playwright test tests/e2e/full-match.spec.ts --headed
```

---

### 9. Log AI Failures to Event Log [MEDIUM] [M]
**File:** `backend/python_api/app.py` line 606 (`ai_move()`)  
**Complexity:** Medium (30 min)

**Current Code:**
```python
try:
    attacker, action_target, reasoning = choose_ai_move_with_claude(match_state)
except Exception:
    try:
        attacker, action_target, reasoning = choose_ai_move(match_state)
    except Exception:
        attacker, action_target, reasoning = None, None, "Claude had no legal move available."
```

**Fix:**
```python
try:
    attacker, action_target, reasoning = choose_ai_move_with_claude(match_state)
except Exception as claude_err:
    append_log(match_state, f"AI (Claude) failed: {str(claude_err)[:100]}. Falling back to random move.")
    try:
        attacker, action_target, reasoning = choose_ai_move(match_state)
    except Exception as fallback_err:
        append_log(match_state, f"AI fallback also failed: {str(fallback_err)[:100]}. No legal moves.")
        attacker, action_target, reasoning = None, None, "Claude had no legal move available."
```

**Acceptance Criteria:**
- [ ] Claude API failures appear in debug log panel
- [ ] Fallback failures also logged
- [ ] Log entries include error message (truncated to 100 chars)
- [ ] Does not break AI turn flow

---

## 🟢 P2 — Medium Priority (Post-Demo)
**Estimated:** 4-6 hours total  
**Defer to Sprint 3 if time-constrained**

### 10. Remove Dead Memory Game Types [SMALL] [S]
**File:** `frontend/modules/shared/src/types/game.ts`  
**Complexity:** Small (10 min)

**Action:** Delete unused types:
- `Card`
- `GameState`
- `GameStatus`
- `Theme`

Keep only Squad RPS types or move to separate file.

**Acceptance Criteria:**
- [ ] No TypeScript errors after deletion
- [ ] `npm run build` passes
- [ ] No unused imports remain

---

### 11. Optimize `piece_at()` Lookup [MEDIUM] [M]
**File:** `backend/python_api/app.py` line 291  
**Complexity:** Medium (45 min)

**Current:** O(n) scan of all 20 pieces per lookup

**Optimized:** O(1) dictionary lookup

```python
def build_position_index(match_state: dict[str, Any]) -> dict[tuple[int, int], dict[str, Any]]:
    """Build a fast position lookup dictionary."""
    return {
        (piece["row"], piece["col"]): piece
        for piece in match_state["pieces"]
        if piece["alive"]
    }

def piece_at_fast(position_index: dict[tuple[int, int], dict[str, Any]], row: int, col: int) -> dict[str, Any] | None:
    """O(1) lookup for piece at position."""
    return position_index.get((row, col))
```

**Acceptance Criteria:**
- [ ] All calls to `piece_at()` replaced with `piece_at_fast()`
- [ ] Index rebuilt after each move/attack
- [ ] Performance: <1ms for any lookup
- [ ] All existing tests still pass

---

### 12. Add CI/CD Pipeline [MEDIUM] [M]
**File:** `.github/workflows/test.yml`  
**Complexity:** Medium (1-2 hours)

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest-cov
      - name: Run backend tests with coverage
        run: |
          cd backend
          pytest --cov=python_api --cov-fail-under=80
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd frontend/app
          npm ci
      - name: Run frontend tests with coverage
        run: |
          cd frontend/app
          npx vitest --coverage --run

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npx playwright test
```

**Acceptance Criteria:**
- [ ] CI runs on every push to main/develop
- [ ] CI runs on every pull request
- [ ] All tests must pass before merge
- [ ] Coverage reports uploaded as artifacts
- [ ] Badge added to README showing test status

---

## 📝 Notes for DEV

### Testing Strategy
1. **Write test FIRST** for each P0 fix
2. **Verify test FAILS** before implementing fix
3. **Implement fix**
4. **Verify test PASSES**
5. **Run full test suite** to catch regressions

### Code Review Checklist
Before marking task complete:
- [ ] Code follows existing patterns
- [ ] No `any` types added
- [ ] Error messages are clear
- [ ] Tests pass locally
- [ ] No console errors in browser
- [ ] Event log shows expected entries

### Commands Reference
```bash
# Backend
cd backend && pytest -v
cd backend && pytest --cov=python_api --cov-report=html
cd backend && uvicorn python_api.app:app --reload

# Frontend
cd frontend/app && npx vitest
cd frontend/app && npx vitest --coverage
cd frontend/app && npm run dev

# E2E
npx playwright test
npx playwright test --headed
npx playwright test --ui

# Type checking
cd frontend/app && npx tsc --noEmit
```

---

## ✅ Definition of Done

**Task is DONE when:**
1. ✅ Code implemented and merged to `develop`
2. ✅ Unit tests written and passing
3. ✅ Manual testing verified
4. ✅ Code reviewed by peer or CTO
5. ✅ No regressions in existing tests
6. ✅ Event log entries added (where applicable)
7. ✅ QA signed off

---

**Last Updated:** 2026-05-04  
**Next Review:** After P0 completion
