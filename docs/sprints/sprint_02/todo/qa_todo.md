# Sprint 2 — QA TODO
**Squad RPS - Team 10**

**Sprint Goal:** Verify critical bug fixes, ensure ≥80% coverage, validate demo readiness

**Timeline:** Immediate (Pre-Demo Sprint)  
**Owner:** [QA]  
**Reviewed by:** [QA Lead]

---

## 🎯 Testing Priorities

### **P0 — Critical Verification (Before Demo)**
1. Hidden-info security audit
2. P0 bug fix validation
3. Full-match smoke test
4. Coverage verification

### **P1 — High Priority (This Week)**
5. Edge case scenarios
6. E2E test coverage
7. Performance validation

### **P2 — Medium Priority (Post-Demo)**
8. Accessibility audit
9. Cross-browser compatibility
10. Load testing

---

## 🔴 P0 — Critical Verification (BLOCKING DEMO)
**Estimated:** 2-3 hours total

### 1. Hidden-Info Security Audit [CRITICAL]
**Priority:** P0  
**Estimated:** 30 min  
**Blocker:** Yes

**Test Scenarios:**

#### Scenario 1.1: Dead Enemy Roles Stay Hidden
**Setup:**
1. Start new match (difficulty: medium)
2. Complete reveal phase
3. Manually position player piece adjacent to enemy
4. Attack and win duel (enemy dies)

**Verify:**
- [ ] During match (before victory): Dead enemy piece shows NO role icon
- [ ] During match: Dead enemy piece label is "Defeated unit"
- [ ] After match ends: Dead enemy roles revealed
- [ ] Check browser Network tab: `/api/game/{id}` response has NO `role` field for dead enemies

**Test Command:**
```bash
# Manual browser test
# 1. Open DevTools → Network tab
# 2. Start match, kill enemy piece
# 3. Inspect /api/game/{id} response
# 4. Search for enemy piece object
# 5. Verify: role === null for dead enemies during match
```

**Expected Result:**
```json
{
  "board": [
    {
      "id": "ai-abc123",
      "owner": "ai",
      "alive": false,
      "label": "Defeated unit",
      "weapon": null,
      "role": null,  // ← Must be null until match ends
      "roleIcon": null
    }
  ]
}
```

**Severity if FAIL:** 🔴 CRITICAL — Hidden-info leak, blocks demo

---

#### Scenario 1.2: Own Dead Pieces Show Roles
**Setup:**
1. Start match
2. Lose a duel (your piece dies)

**Verify:**
- [ ] Your dead piece DOES show role (flag/decoy/soldier)
- [ ] Role icon appears on your dead piece
- [ ] Label shows weapon + role (e.g., "Rock flag")

**Severity if FAIL:** 🟡 MEDIUM — UX issue

---

#### Scenario 1.3: Enemy Weapons Hidden After Duel
**Setup:**
1. Win a duel
2. Observe winner's weapon state

**Verify:**
- [ ] During duel: Both weapons shown
- [ ] After duel: Winner's weapon hidden again
- [ ] Network response: Winner has `weapon: null` in next state
- [ ] UI shows "Hidden Operative" for winner

**Severity if FAIL:** 🔴 CRITICAL — Hidden-info leak

---

### 2. PVP Token Security Test [CRITICAL]
**Priority:** P0  
**Estimated:** 20 min  
**Blocker:** Yes (PVP security)

**Scenario 2.1: Invalid Token Rejected**
**Setup:**
1. Create lobby as Host (save token A)
2. Guest joins (save token B)
3. Manually craft request with fake token C

**Test:**
```bash
# Use curl or Postman
curl -X GET http://localhost:8000/api/match/MATCH_ID \
  -H "X-Player-Token: fake-token-12345"
```

**Verify:**
- [ ] Returns HTTP 401
- [ ] Error message: "Invalid player token."
- [ ] Does NOT return match data

**Severity if FAIL:** 🔴 CRITICAL — Security breach

---

**Scenario 2.2: Valid Token Shows Correct View**
**Setup:**
1. Create PVP match
2. Request as Host (token A)
3. Request as Guest (token B)

**Verify:**
- [ ] Host sees `viewer: "player"` in response
- [ ] Guest sees `viewer: "ai"` in response
- [ ] Host sees Host squad weapons, Guest squad hidden
- [ ] Guest sees Guest squad weapons, Host squad hidden

**Severity if FAIL:** 🔴 CRITICAL — Wrong player view

---

### 3. Reveal Timer Race Condition Test [HIGH]
**Priority:** P0  
**Estimated:** 15 min  
**Blocker:** Yes (UI stuck)

**Scenario 3.1: Refresh During Reveal**
**Setup:**
1. Start match
2. Immediately refresh browser (Ctrl+R or F5)
3. Wait for page reload

**Verify:**
- [ ] Reveal timer continues countdown
- [ ] Timer reaches 0
- [ ] Reveal phase completes automatically
- [ ] Player turn starts
- [ ] NO infinite stuck state

**Test in:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if available)

**Severity if FAIL:** 🔴 CRITICAL — UI stuck forever

---

**Scenario 3.2: Reveal Completes Without Refresh**
**Setup:**
1. Start match
2. Do NOT refresh
3. Wait for 10-second timer

**Verify:**
- [ ] Timer counts down: 10, 9, 8... 1, 0
- [ ] Reveal completes at T=0
- [ ] Roles assigned
- [ ] Board locked during reveal
- [ ] Player turn starts after reveal

**Severity if FAIL:** 🔴 CRITICAL — Core flow broken

---

### 4. Piece Ownership Exploit Test [MEDIUM]
**Priority:** P0  
**Estimated:** 15 min  
**Blocker:** No, but prevents cheating

**Scenario 4.1: Player Cannot Attack with AI Piece**
**Setup:**
1. Start solo match (vs AI)
2. Open browser DevTools → Console
3. Get AI piece ID from Network response
4. Manually send attack request:

```javascript
fetch('http://localhost:8000/api/match/MATCH_ID/turn/player-attack', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    attackerId: 'ai-abc123',  // ← AI piece ID
    targetId: 'player-xyz789'
  })
})
```

**Verify:**
- [ ] Returns HTTP 400
- [ ] Error message: "Cannot attack with AI pieces."
- [ ] Match state unchanged
- [ ] Event log has NO attack entry

**Severity if FAIL:** 🟡 MEDIUM — Exploit allows cheating

---

### 5. Full-Match Smoke Test [CRITICAL]
**Priority:** P0  
**Estimated:** 45 min  
**Blocker:** Yes — Core gameplay validation

**Scenario 5.1: Complete Match (Win by Flag Capture)**
**Setup:** Manual playthrough

**Steps:**
1. Start match (difficulty: easy)
2. Complete reveal phase (memorize enemy positions)
3. Move front-row piece forward (row 2 → row 3)
4. AI takes turn
5. Continue moving until adjacent to enemy
6. Attack enemy piece
7. Win duel (verify RPS logic)
8. Continue until enemy Flag captured

**Verify:**
- [ ] ✅ Reveal: 10-second timer works
- [ ] ✅ Roles: Assigned after reveal
- [ ] ✅ Movement: Piece advances 1 square
- [ ] ✅ Attack: Duel overlay appears
- [ ] ✅ RPS Logic: Rock beats Scissors, etc.
- [ ] ✅ Winner: Stays on board, weapon hides
- [ ] ✅ Loser: Removed from board
- [ ] ✅ Flag Death: Match ends immediately
- [ ] ✅ Result Screen: Shows "Victory" + reason
- [ ] ✅ Stats: Duration, duels won/lost correct
- [ ] ✅ Debug Log: All moves logged

**Time Limit:** Match should complete in <5 minutes

**Severity if FAIL:** 🔴 CRITICAL — Core loop broken

---

**Scenario 5.2: Tie-Repick Flow**
**Setup:**
1. Position pieces adjacent
2. Attack with matching weapons (rock vs rock)

**Verify:**
- [ ] Duel shows "TIE"
- [ ] Repick UI appears
- [ ] Select new weapon (paper)
- [ ] AI picks new weapon (random)
- [ ] Duel resolves with new weapons
- [ ] Loser eliminated, winner stays
- [ ] Tie counter increments in stats

**Severity if FAIL:** 🔴 CRITICAL — Tie loop broken

---

### 6. Coverage Verification [HIGH]
**Priority:** P0  
**Estimated:** 30 min  
**Blocker:** No, but CTO requirement

**Test Commands:**

#### Backend Coverage
```bash
cd backend
pytest --cov=python_api --cov-report=html --cov-report=term-missing
```

**Verify:**
- [ ] Total coverage ≥ 80%
- [ ] `app.py` coverage ≥ 75%
- [ ] `service.py` coverage ≥ 80%
- [ ] `schemas.py` coverage ≥ 90% (simple validation)
- [ ] HTML report generated: `backend/htmlcov/index.html`

**Critical Uncovered Lines:**
- [ ] Document any lines <80% in QA report
- [ ] File bug for missing test coverage

---

#### Frontend Coverage
```bash
cd frontend/app
npx vitest --coverage
```

**Verify:**
- [ ] Total coverage ≥ 80%
- [ ] `useGame.ts` coverage ≥ 85%
- [ ] Components coverage ≥ 70% (presentational, less critical)
- [ ] HTML report: `frontend/app/coverage/index.html`

**Critical Uncovered Lines:**
- [ ] `useGame.ts` edge cases
- [ ] Error boundary handlers
- [ ] PVP polling logic

---

## 🟡 P1 — High Priority (This Week)
**Estimated:** 5-6 hours total

### 7. Fullscreen Board Layout Validation [HIGH]
**Priority:** P1  
**Estimated:** 1 hour  
**Related DEV Task:** #5

**Test Scenarios:**

#### Scenario 7.1: Desktop Fullscreen (1920×1080)
**Setup:**
1. Open game on desktop monitor (≥1920×1080)
2. Start match

**Verify:**
- [ ] Board fills 80-90% of viewport height
- [ ] Cell size ≥60px × 60px
- [ ] 5×6 grid aspect ratio maintained (not stretched)
- [ ] Sidebar visible on right (360px wide)
- [ ] No horizontal scrollbar
- [ ] All cells clickable without overlap

**Measure:**
```javascript
// Browser console
const cell = document.querySelector('.nati-board-cell');
const rect = cell.getBoundingClientRect();
console.log(`Cell size: ${rect.width}px × ${rect.height}px`);
// Should be ≥60px for demo readability
```

**Severity if FAIL:** 🟡 MEDIUM — Demo visibility issue

---

#### Scenario 7.2: Laptop (1366×768)
**Setup:**
1. Resize browser to 1366×768
2. Start match

**Verify:**
- [ ] Board still readable (cells ≥50px)
- [ ] No content cut off
- [ ] Sidebar visible or stacked below board
- [ ] Debug panel accessible

**Severity if FAIL:** 🟡 MEDIUM — Common resolution

---

#### Scenario 7.3: Tablet (iPad 1024×768)
**Setup:**
1. Open on iPad or simulate with DevTools
2. Rotate portrait and landscape

**Verify:**
- [ ] **Portrait:** Sidebar below board (stacked layout)
- [ ] **Landscape:** Sidebar beside board OR hidden with toggle
- [ ] Board scales appropriately
- [ ] Touch targets ≥44px (iOS guideline)

**Severity if FAIL:** 🟢 LOW — Tablet not primary demo device

---

#### Scenario 7.4: Mobile (375×667 iPhone SE)
**Setup:**
1. Simulate iPhone SE in DevTools
2. Test portrait only

**Verify:**
- [ ] Single column layout
- [ ] Board visible without horizontal scroll
- [ ] Controls accessible
- [ ] Text readable (≥14px font size)

**Severity if FAIL:** 🟢 LOW — Mobile not demo target

---

#### Scenario 7.5: Projector Simulation (1280×720)
**Setup:**
1. Resize browser to 1280×720 (720p projector)
2. View from ~10 feet away (or simulate with zoom out)

**Verify:**
- [ ] Cell size ≥60px
- [ ] Piece labels readable
- [ ] Weapon icons distinguishable
- [ ] Duel overlay clearly visible

**Test Method:**
- Zoom browser to 67% (simulates 10-foot viewing distance)
- All critical info should still be readable

**Severity if FAIL:** 🔴 HIGH — Demo presentation issue

---

#### Scenario 7.6: Browser Zoom (200%, 300%)
**Setup:**
1. Start match
2. Zoom browser: `Ctrl +` (Windows) or `Cmd +` (Mac)
3. Test at 200% and 300%

**Verify:**
- [ ] Layout doesn't break
- [ ] No text overflow
- [ ] Horizontal scroll acceptable
- [ ] All controls still accessible

**Severity if FAIL:** 🟢 LOW — Accessibility edge case

---

#### Scenario 7.7: Duel Overlay Positioning
**Setup:**
1. Enable fullscreen board
2. Trigger duel

**Verify:**
- [ ] Duel overlay centered on board
- [ ] Doesn't overflow viewport
- [ ] Weapon images visible
- [ ] Repick buttons clickable

**Severity if FAIL:** 🟡 MEDIUM — Core interaction broken

---

#### Scenario 7.8: Debug Panel Accessibility
**Setup:**
1. Enable fullscreen board
2. Enable debug panel

**Verify:**
- [ ] Debug panel visible (sidebar or collapsible)
- [ ] Doesn't overlap board
- [ ] Scrollable if content overflows
- [ ] Toggle button works (if collapsible design)

**Severity if FAIL:** 🟡 MEDIUM — Debugging tool unavailable

---

#### Scenario 7.9: Cross-Browser Consistency
**Test in:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Verify:**
- [ ] Board size consistent across browsers
- [ ] Grid gap/spacing same
- [ ] No CSS Grid bugs (Safari older versions)
- [ ] Flexbox fallback works if needed

**Severity if FAIL:** 🟡 MEDIUM — Browser compatibility

---

### 8. Edge Case Scenarios [HIGH]
**Priority:** P1  
**Estimated:** 2 hours

**Scenario 8.1: Decoy Absorbs Multiple Attacks**
**Setup:**
1. Manually edit match state: Set enemy piece as Decoy
2. Attack Decoy 5 times in a row

**Verify:**
- [ ] Decoy survives all 5 attacks
- [ ] Attacker dies if they lose RPS
- [ ] `decoyAbsorbed` stat increments
- [ ] Decoy never shows role until match ends

**Severity if FAIL:** 🟡 MEDIUM — Decoy mechanic broken

---

**Scenario 8.2: Flag Death During Tie-Repick**
**Setup:**
1. Attack enemy Flag, result is TIE
2. Enter repick phase
3. Flag-bearer selects new weapon
4. Opponent selects winning weapon

**Verify:**
- [ ] Flag dies
- [ ] Match ends immediately
- [ ] Result screen shows "Enemy flag captured"
- [ ] No crash or undefined state

**Severity if FAIL:** 🟡 MEDIUM — Edge case crash

---

**Scenario 8.3: Stalemate (Only Decoy Remains)**
**Setup:**
1. Kill all enemy pieces except Decoy
2. Your Flag still alive

**Current Behavior (Document):**
- [ ] Decoy cannot be killed
- [ ] Match cannot end
- [ ] Infinite stalemate

**Expected (Future):**
- Decoy becomes killable when last piece

**Action:** File bug for post-demo fix

---

**Scenario 8.4: All Player Pieces Dead**
**Setup:**
1. Lose all duels
2. Player has 0 alive pieces

**Verify:**
- [ ] Match ends
- [ ] Result: "Defeat"
- [ ] Reason: "All your units were eliminated" or similar

**Severity if FAIL:** 🟡 MEDIUM — Win condition logic

---

### 9. E2E Test Coverage [HIGH]
**Priority:** P1  
**Estimated:** 1 hour (review + run)

**Run Full E2E Suite:**
```bash
npx playwright test
```

**Verify:**
- [ ] `example.spec.ts` (setup screen) passes
- [ ] `full-match.spec.ts` (DEV task #8) passes
- [ ] No flaky tests (run 3 times, all pass)
- [ ] Tests run in <60 seconds total

**Missing E2E (File Bugs):**
- [ ] PVP match flow
- [ ] Lobby creation + join
- [ ] Network error recovery
- [ ] Concurrent player moves

---

### 10. Performance Validation [MEDIUM]
**Priority:** P1  
**Estimated:** 30 min

**Scenario 9.1: AI Response Time**
**Setup:**
1. Start 5 matches in a row
2. Measure AI turn duration

**Verify:**
- [ ] AI responds in <3 seconds (95th percentile)
- [ ] No timeouts
- [ ] Fallback moves work if Claude slow

**Test Command:**
```bash
# Manual: Start match, use browser Performance tab
# Record: Time from "AI Turn" → board update
```

**Severity if FAIL:** 🟡 MEDIUM — Sluggish demo

---

**Scenario 9.2: Board Rendering Performance**
**Setup:**
1. Open Chrome DevTools → Performance
2. Record during full match (50+ moves)

**Verify:**
- [ ] No frame drops during animations
- [ ] Duel overlay renders in <100ms
- [ ] State updates cause <50ms re-render

**Severity if FAIL:** 🟢 LOW — Cosmetic

---

## 🟢 P2 — Medium Priority (Post-Demo)
**Estimated:** 3-4 hours total

### 11. Accessibility Audit [MEDIUM]
**Priority:** P2  
**Estimated:** 1 hour

**Test with:**
- [ ] Keyboard only (no mouse)
- [ ] Screen reader (NVDA or VoiceOver)
- [ ] 200% zoom
- [ ] High contrast mode

**Verify:**
- [ ] Can start match with keyboard
- [ ] Can select pieces with Tab + Enter
- [ ] Focus indicators visible
- [ ] Screen reader announces moves
- [ ] No keyboard traps

**Tools:**
- Lighthouse accessibility audit
- axe DevTools extension

**Severity if FAIL:** 🟢 LOW — Defer to v2

---

### 12. Cross-Browser Compatibility [MEDIUM]
**Priority:** P2  
**Estimated:** 1 hour

**Test in:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Verify:**
- [ ] Board renders correctly
- [ ] Animations work
- [ ] WebSocket/polling works (PVP)
- [ ] No console errors

**Known Issues:**
- Safari: CSS Grid quirks?
- Firefox: Animation timing?

**Severity if FAIL:** 🟢 LOW — Chrome-only demo OK

---

### 13. Load Testing [LOW]
**Priority:** P2  
**Estimated:** 1 hour

**Scenario:** 10 concurrent PVP matches

**Setup:**
1. Use Playwright to spawn 20 browser instances
2. Create 10 lobbies
3. Join + play simultaneously

**Verify:**
- [ ] Backend handles 20 concurrent requests
- [ ] No match state corruption
- [ ] Polling doesn't overwhelm server
- [ ] Memory usage <500MB

**Severity if FAIL:** 🟢 LOW — Single-user demo

---

## 📋 QA Checklist Template

### Per-Task Verification
**For each DEV task completed:**

```markdown
## Task: [Task Name]
**DEV:** [Developer Name]  
**QA Date:** YYYY-MM-DD

### Functional Testing
- [ ] Happy path works
- [ ] Error cases handled
- [ ] Edge cases covered

### Code Review
- [ ] No `any` types added
- [ ] Error messages clear
- [ ] Event log entries present

### Regression Testing
- [ ] Existing tests still pass
- [ ] No new console errors
- [ ] No visual regressions

### Performance
- [ ] No noticeable slowdown
- [ ] Network requests efficient

### Documentation
- [ ] README updated (if needed)
- [ ] Comments added for complex logic

### Sign-off
- [ ] ✅ PASS — Ready for merge
- [ ] ⚠️ PASS with NOTES — See below
- [ ] ❌ FAIL — See bugs filed
```

---

## 🐛 Bug Report Template

```markdown
## Bug: [Short Title]

**Severity:** Critical / High / Medium / Low  
**Component:** Backend / Frontend / API / E2E  
**Found by:** [QA Name]  
**Date:** YYYY-MM-DD

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots/Logs:**
[Attach or paste]

**Environment:**
- OS: [Windows/Mac/Linux]
- Browser: [Chrome 120 / Firefox 115 / etc]
- Backend: [Python version, FastAPI version]
- Frontend: [Node version, React version]

**Priority:**
[Why this severity? Blocking demo?]

**Suggested Fix:**
[Optional — if obvious]
```

---

## 📊 Test Summary Report Template

```markdown
# Sprint 2 QA Summary

**Date:** YYYY-MM-DD  
**QA Lead:** [Name]  
**Status:** PASS / CONDITIONAL / FAIL

---

## Test Execution

| Priority | Planned | Executed | Passed | Failed | Blocked |
|----------|---------|----------|--------|--------|---------|
| P0       | 6       | 6        | 5      | 1      | 0       |
| P1       | 5       | 5        | 4      | 1      | 0       |
| P2       | 4       | 2        | 2      | 0      | 2       |

---

## Coverage Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Backend Coverage | ≥80% | 84% | ✅ PASS |
| Frontend Coverage | ≥80% | 78% | ⚠️ BELOW |
| E2E Scenarios | 3 | 2 | ⚠️ PARTIAL |

---

## Security Audit

- [ ] ✅ Hidden-info leak fixed
- [ ] ✅ PVP token validation works
- [ ] ✅ CORS restricted
- [ ] ✅ No API key in frontend

---

## Bugs Found

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| #101 | Reveal timer stuck on refresh | HIGH | FIXED |
| #102 | Dead piece role leak | CRITICAL | FIXED |
| #103 | Decoy stalemate | MEDIUM | DEFERRED |

---

## Risks

1. **Frontend coverage 78%** — Below 80% target. Missing tests for error boundaries.
2. **Decoy stalemate** — No resolution yet. Will infinite loop if triggered.
3. **PVP load testing** — Not completed. Unknown behavior with 10+ concurrent matches.

---

## Recommendation

**Ship Status:** ✅ CONDITIONAL PASS

- P0 bugs fixed and verified
- Core gameplay stable
- Coverage acceptable (backend ✅, frontend ⚠️)
- **Condition:** Document Decoy stalemate workaround in demo script

**Demo-Ready:** YES (with notes)

---

**Next Steps:**
1. Complete frontend coverage (add 2% via error boundary tests)
2. File backlog item: Decoy stalemate resolution
3. Sprint 3: PVP load testing + accessibility
```

---

## ✅ Definition of Done (QA)

**Task is DONE when:**
1. ✅ All test scenarios executed
2. ✅ Bugs filed with clear repro steps
3. ✅ Coverage metrics documented
4. ✅ Regression suite passes
5. ✅ QA sign-off recorded
6. ✅ Test summary report completed

---

**Last Updated:** 2026-05-04  
**Next Review:** After P0 verification complete
