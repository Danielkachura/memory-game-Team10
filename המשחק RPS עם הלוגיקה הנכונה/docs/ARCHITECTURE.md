# Technical Architecture
# Memory Game - Team 10

This document describes the target MVP architecture that the team should implement.

---

## 1. Architecture Summary

The system is split into:
- a browser client that owns all memory-game state and rendering
- a minimal server-side Claude proxy that owns API key usage
- a test suite spanning unit, integration, and end-to-end coverage

The game must remain playable when Claude features fail.

---

## 2. Team Ownership

| Area | Owner under CTO | Responsibility |
|---|---|---|
| System boundaries and shared contracts | `[Architect]` | Shared types, module interfaces, dependency rules |
| React app and UI behavior | `[Tech Lead:frontend]` | Components, hooks, accessibility, responsiveness |
| Claude proxy and API contracts | `[Tech Lead:backend]` | `/api/claude`, validation, timeout, fallback support |
| Test strategy and release gates | `[QA Lead]` | Coverage map, regression suite, sign-off criteria |
| Secret handling and exposure checks | `[Security Reviewer]` | `ANTHROPIC_API_KEY`, browser bundle review, deployment checks |

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite in `frontend/app/` | Fast iteration and clear state modeling |
| Styling | Tailwind CSS + CSS variables | Fast MVP build with centralized tokens |
| State | React hooks with reducer-style transitions | Enough structure without extra state libraries |
| Unit and integration tests | Vitest + Testing Library | Fast local feedback and Vite-native setup |
| E2E | Playwright | Browser flow coverage and screenshots |
| AI | Anthropic Claude API | Hackathon requirement and feature differentiator |
| Proxy | Python FastAPI backend with Vite forwarding `/api` in development | Keeps secrets server-side with minimal overhead |

---

## 4. Runtime Topology

```text
Browser Client
  |
  | POST /api/claude
  v
Server-side Claude Proxy
  |
  v
Anthropic Claude API
```

Rules:
- Card flipping, matching, timer, scoring, and win detection stay in the browser
- Claude is called only on explicit feature triggers
- No browser bundle may contain `ANTHROPIC_API_KEY`

---

## 5. Frontend Module Plan

```text
frontend/
  app/
    src/
  modules/
    shared/
      src/
        types/
        constants/
        utils/
    game/
      src/
        components/
        hooks/
        utils/
    ai/
      src/
        prompts/
        services/
    ui/
      src/
        components/
        styles/
```

### `shared`
- Canonical types: `Difficulty`, `Theme`, `GameStatus`, `Card`, `GameState`, `Score`
- Difficulty constants and board sizing
- Generic helpers safe for reuse across modules

### `game`
- `useGame` reducer or reducer-style hook for all state transitions
- `GameBoard`, `Card`, `ScorePanel`, `Timer`, `WinScreen`, `GameSetup`
- `shuffle`, `matchCheck`, `scoreCalculator`

### `ai`
- Prompt builders for theme, hint, and narrator requests
- `claudeClient` wrapper for browser-to-proxy calls
- Higher-level services for hint text, theme generation, and recap generation

### `ui`
- Shared components such as `Button`, `Modal`, `Badge`, `StarRating`
- Shared CSS variable layer based on `docs/ui/UI_KIT.md`

---

## 6. Backend Module Plan

```text
backend/python_api/
  app.py
  config.py
  schemas.py
  service.py
  tests/
```

Responsibilities:
- validate request shape
- enforce model and token limits
- inject the API key server-side
- apply timeout protection
- normalize fallback-friendly errors for the frontend

No database is part of the MVP.

---

## 7. Data Contracts

Canonical game types:

```ts
type Difficulty = "easy" | "medium" | "hard";
type Theme = "animals" | "flags" | "space" | "custom-ai";
type GameStatus = "idle" | "playing" | "paused" | "won";

interface Card {
  id: string;
  pairId: string;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameState {
  cards: Card[];
  flippedIds: string[];
  matchedPairs: number;
  totalPairs: number;
  moves: number;
  timeElapsed: number;
  status: GameStatus;
  difficulty: Difficulty;
  theme: Theme;
}

interface Score {
  moves: number;
  timeElapsed: number;
  difficulty: Difficulty;
  stars: 1 | 2 | 3;
}
```

Proxy request contract:
- frontend sends feature-specific prompt input
- backend resolves model, token budget, timeout, and API headers
- frontend never chooses secret-bearing config

---

## 8. Core Flows

### New Game
1. Player selects difficulty and theme
2. App derives pair count from difficulty
3. If theme is `custom-ai`, call theme generator through proxy
4. Build duplicated pair cards and shuffle them
5. Reset timer, moves, matched count, and win state

### Flip and Match
1. Ignore clicks on matched cards, flipped cards, or while resolving two flips
2. Flip first card
3. Flip second card
4. Increment moves
5. If `pairId` matches, mark both as matched and clear `flippedIds`
6. If not, hold briefly, then flip both back and clear `flippedIds`
7. If all pairs matched, set status to `won`

### Hint Request
1. Player clicks hint button
2. Frontend sends safe summary of game state
3. Proxy calls Claude with hint prompt
4. Frontend shows hint or fallback text

### Win Recap
1. Game enters `won`
2. Score is calculated
3. Frontend requests narrator text
4. UI shows recap or fallback message

---

## 9. Non-Functional Requirements

- Accessibility: keyboard reachable, semantic controls, reduced-motion support
- Performance: no Claude call on card flips, no unnecessary rerenders across the board
- Reliability: all Claude features degrade gracefully within 8 seconds
- Security: key stays server-side, request payloads validated, no raw proxy pass-through

---

## 10. Testing Matrix

| Level | Scope | Owner |
|---|---|---|
| Unit | shuffle, matchCheck, scoreCalculator, prompt builders, proxy validators | DEV + QA |
| Integration | `useGame`, AI service wrappers, proxy route behavior | DEV + QA |
| E2E | setup flow, play-to-win flow, hint fallback, recap fallback | QA |

Critical checks:
- no third card can flip while two unresolved cards are open
- grid dimensions match selected difficulty
- timer starts on first flip and stops on win
- score thresholds match spec
- custom theme failures still produce a playable board

---

## 11. Open Architectural Tasks

- create frontend `shared`, `game`, `ai`, and `ui` modules
- implement and extend the Python backend in `backend/python_api/`
- expand the `frontend/app` workspace from scaffold into the full playable game
