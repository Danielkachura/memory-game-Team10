# Product Requirements Document (PRD)
# Memory Game — Team 10

---

## 1. Overview

**Project Name:** Memory Game — Team 10

**One-line description:** A browser-based card-matching memory game with AI-powered themes, hints, and end-game narration via the Claude API.

**Problem:** Classic memory games are static — same cards every time, no feedback, no intelligence. Players get bored fast and have no guidance when stuck.

**Target Users:** Casual gamers of any age who want a quick, fun, replayable brain game in the browser. Hackathon judges who want to see a working Claude API integration.

---

## 2. Core Features

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Card matching game | Flip cards to find matching pairs. Grid size varies by difficulty. | Must Have |
| 2 | Difficulty levels | Easy (4×3), Medium (4×4), Hard (6×4). Player selects before start. | Must Have |
| 3 | AI theme generator | Claude generates card content (emojis/words) for a chosen theme. | Must Have |
| 4 | AI hint system | Player requests a cryptic hint from Claude when stuck. | Must Have |
| 5 | Score & timer | Track moves and elapsed time. Award 1–3 stars at game end. | Nice to Have |
| 6 | AI end-game recap | Claude writes a short fun summary of the player's performance. | Nice to Have |

---

## 3. User Stories

### Story 1: Playing the game

> As a player, I want to flip cards and find matching pairs,
> so that I can complete the board and feel a sense of achievement.

**Acceptance Criteria:**
- [ ] Clicking a face-down card flips it face-up and shows its content
- [ ] A second clicked card is compared to the first
- [ ] If they match, both stay face-up and are marked as matched (visual indicator)
- [ ] If they don't match, both flip back face-down after a short delay (~1 second)
- [ ] A third card cannot be flipped while two unmatched cards are visible
- [ ] The game ends when all pairs are matched
- [ ] A win screen is shown with moves, time, and star rating

### Story 2: Choosing difficulty and theme

> As a player, I want to choose how hard the game is and what theme the cards use,
> so that I can replay the game and keep it fresh.

**Acceptance Criteria:**
- [ ] Player can select Easy / Medium / Hard before starting
- [ ] Player can select a theme (Animals, Flags, Space, Custom AI)
- [ ] Selecting "Custom AI" triggers Claude to generate unique card content
- [ ] The board grid changes size correctly per difficulty
- [ ] A "New Game" button resets and re-shuffles the board

### Story 3: Getting a hint from Claude

> As a player, I want to ask Claude for a hint when I'm stuck,
> so that I get a nudge without having the answer given away.

**Acceptance Criteria:**
- [ ] A "Hint" button is visible during gameplay
- [ ] Clicking it sends the current game state to Claude and shows a response
- [ ] The hint is cryptic and helpful, not a direct reveal of card positions
- [ ] If the Claude API is unavailable, a fallback message is shown instead
- [ ] The hint does not interrupt or reset the game state

### Story 4: End-game AI recap

> As a player, I want Claude to react to how I played at the end of the game,
> so that the victory screen feels personal and rewarding.

**Acceptance Criteria:**
- [ ] After all pairs are matched, Claude is called with the player's stats
- [ ] A short 2-sentence recap appears on the win screen
- [ ] Tone matches performance: triumphant if 3★, encouraging if 2★, playful if 1★
- [ ] If the Claude API fails, a default congratulations message is shown instead

---

## 4. Out of Scope

- User accounts, login, or persistent leaderboards (no backend database)
- Multiplayer or real-time features
- Mobile app — browser only
- Paid themes or in-app purchases
- Social sharing of scores

---

## 5. Success Criteria

- [ ] A player can complete a full Easy game: start → play → win screen — no errors
- [ ] At least one Claude API feature works live (theme gen OR hint OR recap)
- [ ] The game handles Claude API failure gracefully — it still plays without AI
- [ ] Unit tests cover card flip logic, match detection, and score calculation
- [ ] At least one Playwright E2E test covers the core game flow
- [ ] The dev server starts clean with `npm run dev`

---

## 6. Technical Constraints

- **Must use:** Claude API (Anthropic) — minimum one integrated AI feature for the demo
- **Must use:** React + TypeScript + Vite (frontend)
- **Must not use:** Any backend database or user authentication
- **Must not use:** `ANTHROPIC_API_KEY` exposed in browser or `VITE_` env vars — proxy required
- **Must run on:** Modern desktop browser (Chrome, Firefox, Edge)
- **Must complete in:** Hackathon timeframe — MVP only, no scope creep
