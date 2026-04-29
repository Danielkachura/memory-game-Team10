# Product Requirements Document (PRD)
# RPS Battle — ICQ-Inspired Board Game — Team 10

---

## 1. Overview

**Project Name:** RPS Battle — Team 10

**One-line description:** A 1-vs-AI, Stratego-inspired browser game where players deploy Rock / Paper / Scissors pieces on a 5×6 board, maneuver them tactically, and capture the enemy Flag to win.

**Inspiration:** ICQ's classic RPS online board game — a hidden-information tactical game combining the simplicity of Rock-Paper-Scissors with the positioning depth of Stratego.

**Problem:** Classic RPS is pure luck with no depth. Chess and Stratego have steep learning curves. This game sits in the sweet spot — easy to learn (you already know RPS), hard to master (positioning and memory matter).

**Target Users:** Casual gamers who want a short, replayable tactical game in the browser. Hackathon judges who want to see a polished AI opponent and well-structured React + Python stack.

---

## 2. Game Concept

### Board
- **Grid:** 5 columns × 6 rows (5×6)
- Player 1 (human) occupies **rows 1–2** (bottom two rows) at game start
- AI (Player 2) occupies **rows 5–6** (top two rows) at game start
- Rows 3–4 are the neutral battle zone

### Each Player's Army (10 pieces total)

| Piece | Count | Combat role |
|-------|-------|-------------|
| ✊ Rock | 2–3 | Beats Scissors, loses to Paper |
| 📄 Paper | 2–3 | Beats Rock, loses to Scissors |
| ✂️ Scissors | 2–3 | Beats Paper, loses to Rock |
| 🚩 Flag | 1 | No combat ability — capture it to win |
| 🎭 Decoy | 1 | Disguised as a piece — always loses in combat |

**Total:** 10 pieces per player, 20 pieces on the board.
> The distribution of Rock / Paper / Scissors is flexible (2–3 each) as long as the total is 8 RPS pieces + 1 Flag + 1 Decoy = 10.

### The Reveal Phase (10 seconds)
1. Both armies are placed on the board (setup complete).
2. A **10-second reveal window** opens — both players see **all pieces** face-up, including which squares hold the Flag and Decoy (displayed with their disguise type, e.g., the Decoy appears as a Rock/Paper/Scissors label, but is marked with a subtle indicator during reveal only).
3. After 10 seconds, enemy pieces **flip face-down** — the opponent's board becomes hidden information.
4. The human player's own pieces remain visible to them at all times.

> **Memory mechanic:** The reveal phase is the core memory challenge — players must remember where the AI placed its Flag and Decoy before the board hides.

---

## 3. Core Rules

### Movement
- On each turn, a player moves **one piece** to an **adjacent square** (up, down, left, right — no diagonals).
- A piece cannot move into a square occupied by a friendly piece.
- A piece cannot skip squares.

### Combat
- When a piece moves into a square occupied by an **enemy piece**, RPS resolves **immediately**:

| Attacker vs Defender | Result |
|----------------------|--------|
| Rock vs Scissors | Attacker wins — defender removed |
| Scissors vs Paper | Attacker wins — defender removed |
| Paper vs Rock | Attacker wins — defender removed |
| Same type vs Same type | **Tiebreaker** — see below |
| Any vs Flag | Attacker wins — **Game Over (attacker wins)** |
| Any vs Decoy | Attacker wins — Decoy removed, attacker's true type revealed |
| Decoy vs Any | Defender wins — Decoy removed, Decoy's true identity revealed |

- After combat, the winning piece occupies the contested square.

### Same-Type Tiebreaker
When two pieces of the same type meet in combat, neither is immediately removed. Instead:
1. Both players are prompted to **secretly choose** Rock, Paper, or Scissors.
2. The choices are revealed simultaneously and RPS resolves normally.
3. Steps 1–2 repeat until one player wins — there is no draw outcome from a tiebreaker.
4. The losing piece is removed; the winning piece occupies the square.
> For the AI's tiebreaker choice, the server selects randomly in MVP (Medium/Hard AI may use strategy in v2).

### Winning Condition
- **Capture the enemy Flag** → immediate win.
- If all non-Flag pieces of one side are eliminated → the player with the Flag remaining wins.

### Turn Order
- Human moves first.
- AI responds after each human move.
- No time limit per turn in MVP (consider for v2).

---

## 4. Feature List

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | Setup phase — piece placement | Human clicks to place their 10 pieces in rows 1–2 before the game starts | Must Have |
| 2 | AI setup | AI places its 10 pieces in rows 5–6 automatically (random with basic strategy) | Must Have |
| 3 | Reveal phase (10-second timer) | Both armies shown face-up for 10 seconds, then enemy pieces flip hidden | Must Have |
| 4 | Game board with hidden pieces | 5×6 grid, own pieces visible with type, enemy pieces shown as face-down tiles | Must Have |
| 5 | Movement | Click own piece → valid moves highlight → click destination | Must Have |
| 6 | Combat resolution | RPS resolves on contact, result shown briefly; tiebreaker UI on same-type clash | Must Have |
| 7 | Same-type tiebreaker UI | Prompt player to choose Rock/Paper/Scissors; repeat until resolved | Must Have |
| 8 | Flag capture win condition | Game ends with victory screen on Flag capture | Must Have |
| 9 | AI opponent | AI takes turns, moves pieces with basic tactical logic | Must Have |
| 10 | Piece disguise system | Decoy and Flag assigned a public face (Rock/Paper/Scissors) visible to opponent during reveal only | Must Have |
| 11 | Victory / defeat screen | Shows result, pieces captured, and a replay button | Must Have |
| 12 | Claude AI commentary | Claude narrates key moments (Flag spotted, Decoy revealed, tiebreaker resolved, win/loss) | Nice to Have |
| 13 | Reveal countdown UI | Prominent 10-second countdown timer during reveal phase | Must Have |
| 14 | Capture log | Side panel showing captured pieces per player | Nice to Have |
| 15 | Difficulty levels | Easy / Medium / Hard AI with progressively better strategy | Nice to Have |

---

## 5. User Stories

### Story 1: Setting up the army

> As a player, I want to arrange my 10 pieces on the board before the game starts,
> so that I can choose a strategy for where to hide my Flag and Decoy.

**Acceptance Criteria:**
- [ ] Player is shown an empty 5×6 grid with rows 1–2 available for placement
- [ ] Player has a panel showing 10 pieces to place: 2–3 Rock, 2–3 Paper, 2–3 Scissors (flexible), 1 Flag, 1 Decoy
- [ ] Player assigns a **public disguise** (Rock / Paper / Scissors) to their Flag and Decoy before confirming
- [ ] Player cannot start the game until all 10 pieces are placed
- [ ] A "Randomize" button auto-fills the placement for the player
- [ ] A "Confirm" button locks in the placement and triggers the reveal phase

### Story 2: The reveal phase

> As a player, I want to see the full board for 10 seconds at the start,
> so that I can try to memorize where the enemy Flag and Decoy are hidden.

**Acceptance Criteria:**
- [ ] After both sides confirm placement, a full-board reveal begins
- [ ] All pieces (both players') are shown face-up with their true type
- [ ] The Flag and Decoy are shown with a visual indicator distinguishing them from their disguise
- [ ] A countdown timer (10 → 0) is prominently displayed
- [ ] When the timer reaches 0, enemy pieces automatically flip face-down
- [ ] Player's own pieces remain face-up throughout the game
- [ ] No moves can be made during the reveal phase

### Story 3: Playing a turn

> As a player, I want to select and move one of my pieces per turn,
> so that I can maneuver my army toward the enemy Flag.

**Acceptance Criteria:**
- [ ] Clicking one of my pieces highlights valid destination squares (adjacent, unoccupied by friendly)
- [ ] Clicking a highlighted square moves the piece there
- [ ] If the destination has an enemy piece, combat resolves immediately
- [ ] Combat result is shown briefly (win/lose animation or text overlay)
- [ ] The loser's piece is removed from the board; winner occupies the square
- [ ] If the same piece type clashes, the tiebreaker flow triggers (see Story 6)
- [ ] After my move resolves fully, the AI automatically takes its turn
- [ ] I cannot move during the AI's turn

### Story 4: Winning and losing

> As a player, I want a clear outcome screen when the game ends,
> so that I know whether I won or lost and can start again.

**Acceptance Criteria:**
- [ ] Capturing the enemy Flag immediately ends the game with a victory screen
- [ ] AI capturing my Flag immediately ends the game with a defeat screen
- [ ] Screen shows: result (Win / Lose), pieces I captured, pieces AI captured
- [ ] A "Play Again" button resets to the setup phase
- [ ] If all of one side's non-Flag pieces are eliminated, the remaining Flag holder wins

### Story 5: Remembering the Decoy

> As a player, I encounter an enemy piece that turns out to be a Decoy,
> so that the memory aspect of the game is rewarded.

**Acceptance Criteria:**
- [ ] When my piece attacks what turns out to be a Decoy, the Decoy is removed and my piece survives
- [ ] A clear visual/text indicator shows "Decoy revealed!" on combat
- [ ] The attacker's true type is shown to both sides when the Decoy is eliminated
- [ ] The human player's own Decoy behavior is symmetric — it loses to any attacker

### Story 6: Same-type tiebreaker

> As a player, when my piece clashes with an enemy piece of the same type,
> I want to play a tiebreaker round so the outcome is decided fairly without removing both pieces.

**Acceptance Criteria:**
- [ ] When two pieces of the same type meet, a tiebreaker prompt appears
- [ ] Player is shown a Rock / Paper / Scissors selection UI and must choose before the round resolves
- [ ] The AI's choice is revealed simultaneously after the player confirms
- [ ] Standard RPS rules determine the winner of the tiebreaker
- [ ] If the tiebreaker also draws, the prompt repeats until one side wins
- [ ] The losing piece is removed; the winning piece occupies the contested square
- [ ] The AI's tiebreaker choice is random (MVP); no piece is auto-removed

---

## 6. Piece Disguise System

The Flag and Decoy each need a **public face** to avoid immediately revealing themselves as special pieces (since the board only shows piece type to the opponent):

- During **setup**, the player assigns Rock, Paper, or Scissors as the public label for their Flag and Decoy.
- On the **opponent's board view**, the Flag appears as its assigned public label (e.g., "Rock"), and the Decoy likewise.
- During the **reveal phase only**, a secondary indicator (icon, border, or tooltip) distinguishes the Flag and Decoy from their disguise.
- After reveal, enemy pieces show only their public label (face-down or disguised) — knowing the true type relies on memory.
- When a Decoy is attacked (or attacks), its true identity is revealed in the combat result display.

---

## 7. AI Opponent Behavior

### MVP (Easy)
- Random legal move each turn
- Randomly assigns piece positions during setup
- Tiebreaker choice is random

### Medium (Nice to Have)
- Advances pieces toward the human's side
- Avoids moving the Flag into contested territory
- Remembers which human pieces have been revealed in combat

### Hard (Nice to Have)
- Tracks probability of each hidden human piece based on revealed combat info
- Targets high-value positions
- Protects Flag with a defensive screen

---

## 8. Stack Decisions

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React + TypeScript + Vite + Tailwind CSS | Existing project setup; component model fits board grid, piece state, phased UI, and tiebreaker modal |
| **State management** | Zustand or useReducer | Board state, phase transitions (setup → reveal → play → tiebreaker → end), and selected piece tracking |
| **Backend** | Python + FastAPI | Game logic validation server-side (combat resolution, tiebreaker resolution, move legality, win detection) |
| **AI opponent** | Python (backend) | Deterministic logic, easy to upgrade to Claude-powered reasoning |
| **Claude API** | Anthropic Claude API via existing proxy | Optional commentary / narration; same proxy pattern as original game |
| **Testing** | Vitest (unit) + Playwright (E2E) | Existing setup retained |

### Why Python backend for game logic?
- Combat resolution (including tiebreaker) and move validation must be **server-authoritative** so the player can't cheat
- AI opponent logic is cleaner in Python than a React hook
- FastAPI is WebSocket-ready for future multiplayer upgrade (v2)
- Keeps React frontend purely presentational and interactive

---

## 9. Data Model (TypeScript)

```ts
type PieceType = "rock" | "paper" | "scissors";
type SpecialType = "flag" | "decoy";
type AnyPieceType = PieceType | SpecialType;
type Owner = "player" | "ai";
type GamePhase = "setup" | "reveal" | "playing" | "tiebreaker" | "gameover";

interface Position {
  col: number; // 0–4
  row: number; // 0–5
}

interface Piece {
  id: string;
  owner: Owner;
  trueType: AnyPieceType;         // actual piece identity
  disguise: PieceType;            // public label (rock/paper/scissors)
  position: Position;
  isRevealed: boolean;            // true after seen in combat or during reveal
  isCaptured: boolean;
}

interface CombatResult {
  attackerId: string;
  defenderId: string;
  outcome: "attacker_wins" | "defender_wins" | "tiebreaker" | "game_over";
  revealedType?: AnyPieceType;    // what the defender actually was (Decoy / Flag reveal)
}

interface TiebreakerState {
  attackerId: string;
  defenderId: string;
  playerChoice: PieceType | null;
  aiChoice: PieceType | null;
  round: number;
}

interface GameState {
  phase: GamePhase;
  board: Piece[];
  currentTurn: Owner;
  selectedPieceId: string | null;
  revealCountdown: number;        // seconds remaining (10→0 during reveal phase)
  tiebreaker: TiebreakerState | null;
  capturedByPlayer: Piece[];
  capturedByAI: Piece[];
  winner: Owner | null;
  combatLog: CombatResult[];
}
```

---

## 10. Backend API Contracts (FastAPI)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /game/new` | POST | Initialize a new game, return initial GameState with AI placement |
| `POST /game/place` | POST | Submit human's piece placement, trigger reveal phase |
| `POST /game/move` | POST | Submit human move → validate, resolve combat (or enter tiebreaker), run AI turn, return updated state |
| `POST /game/tiebreaker` | POST | Submit human's tiebreaker choice → resolve round, repeat or conclude, return updated state |
| `GET /game/state` | GET | Return current game state (for sync / reconnect) |
| `POST /api/claude` | POST | Existing Claude proxy — reused for commentary feature |

All game logic (combat resolution, tiebreaker, win detection, move legality) is evaluated server-side. Frontend is responsible for rendering only.

---

## 11. Game Phases & Flow

```
[Setup Phase]
  Human places 10 pieces in rows 1–2
  Assigns disguise to Flag and Decoy
  Clicks "Confirm"
      ↓
[Reveal Phase — 10 seconds]
  All pieces shown face-up
  Countdown timer displayed
  Timer expires → enemy pieces flip hidden
      ↓
[Playing Phase]
  Human selects piece → valid moves highlighted
  Human moves piece
  Server validates move + resolves combat:
    → Normal win/loss: piece removed, turn continues to AI
    → Decoy hit: Decoy removed, attacker survives, identity revealed
    → Flag hit: Game Over
    → Same-type clash: enter Tiebreaker Phase
      ↓ (on same-type clash)
[Tiebreaker Phase]
  Player chooses Rock / Paper / Scissors
  AI choice revealed simultaneously
  If winner: loser removed, winner occupies square → return to Playing Phase
  If draw again: repeat Tiebreaker Phase
      ↓ (after tiebreaker resolves)
[Playing Phase — AI Turn]
  Server runs AI move
  Updated state returned → UI re-renders
  Repeat until win condition met
      ↓
[Game Over]
  Victory or defeat screen
  Shows captured pieces + result
  "Play Again" → back to Setup Phase
```

---

## 12. Out of Scope (MVP)

- Real-time multiplayer (2 human players) — planned for v2
- Persistent leaderboards or user accounts
- Mobile app — desktop browser only
- Time limit per turn
- Diagonal movement
- Undo move

---

## 13. Success Criteria

- [ ] Human can place all 10 pieces (flexible Rock/Paper/Scissors distribution) and start the game
- [ ] Reveal phase shows all pieces for exactly 10 seconds, then hides enemy pieces
- [ ] Human can click a piece, see valid moves, and execute a move each turn
- [ ] Combat resolves correctly for all RPS combinations, including Flag and Decoy edge cases
- [ ] Same-type clashes trigger the tiebreaker prompt and repeat correctly until resolved
- [ ] AI takes a legal move after every fully resolved human turn
- [ ] Game ends with correct win/lose screen on Flag capture
- [ ] All game logic validation (including tiebreaker) runs server-side
- [ ] Unit tests cover: combat resolver, tiebreaker loop, move validator, win condition checker, AI move generator
- [ ] At least one Playwright E2E test covers setup → reveal → one full turn cycle including a tiebreaker

---

## 14. Technical Constraints

- **Must use:** React + TypeScript + Vite (existing frontend setup)
- **Must use:** Python + FastAPI for backend game logic
- **Must not:** Resolve combat, tiebreakers, or validate moves in frontend-only code (cheat prevention)
- **Must not:** Expose `ANTHROPIC_API_KEY` in browser or `VITE_` env vars
- **Must run on:** Modern desktop browser (Chrome, Firefox, Edge)
- **Must complete in:** Hackathon timeframe — MVP scope only

---

*Document version: 1.1 | Status: Draft — pending team review*
