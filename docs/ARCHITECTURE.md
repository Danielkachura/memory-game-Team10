# Technical Architecture
# Squad RPS - Team 10

This document describes the current target architecture for the Squad RPS MVP.

---

## 1. Architecture Summary

The system is split into:
- a React browser client that renders the game and sends player actions
- a Python FastAPI backend that owns authoritative match state and hidden information
- Claude-backed backend services for squad generation and AI move selection
- a test suite spanning frontend unit tests, backend API tests, and browser verification

The backend is the source of truth for gameplay. The frontend does not own canonical combat, movement, or hidden-role state.

---

## 2. Team Ownership

| Area | Owner under CTO | Responsibility |
|---|---|---|
| System boundaries and match-state contracts | `[Architect]` | module boundaries, data contracts, hidden-state rules |
| React app and gameplay UX | `[Tech Lead:frontend]` | components, hooks, legal-action clarity, accessibility |
| Match engine and AI/server contracts | `[Tech Lead:backend]` | FastAPI routes, game rules, AI requests, validation |
| UI clarity and demo-facing polish | `[UI/UX Lead]` | board readability, duel clarity, interaction affordances |
| Test strategy and release gates | `[QA Lead]` | regression coverage, demo sign-off, bug triage |
| Secret handling and hidden-state exposure checks | `[Security Reviewer]` | API key handling, viewer redaction, trust boundaries |

---

## 3. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + TypeScript + Vite in `frontend/app/` | fast iteration and direct UI state modeling |
| Styling | CSS variables + app stylesheet | centralized tokens and controlled gameplay styling |
| Frontend state | React hooks | enough structure without extra client state libraries |
| Backend | Python + FastAPI in `backend/python_api/` | simple authoritative API with clear validation |
| Unit and integration tests | Vitest + Testing Library | fast frontend feedback |
| Backend API tests | `unittest` + FastAPI `TestClient` | deterministic rule verification |
| E2E | Playwright | browser flow verification |
| AI | Anthropic Claude API | squad generation and AI move selection |

---

## 4. Runtime Topology

```text
Browser Client
  |
  | GET/POST /api/*
  v
FastAPI Match Service
  |
  +--> authoritative match engine
  +--> hidden-state projection
  +--> AI fallback logic
  |
  v
Anthropic Claude API
```

Rules:
- the browser sends actions, not trusted game outcomes
- the backend validates every move, attack, repick, and AI action
- hidden enemy roles and hidden enemy weapons are never trusted to the frontend
- `ANTHROPIC_API_KEY` stays server-side only

---

## 5. Frontend Module Plan

```text
frontend/
  app/
    src/
  modules/
    game/
      src/
        components/
        hooks/
    ai/
      src/
    shared/
      src/
```

### `game`
- `useGame` orchestrates match fetches, player actions, reveal timing, and AI turn requests
- `GameScreen` renders:
  - setup flow
  - HUD
  - board
  - duel panel
  - repick controls
  - debug log
  - result state

Frontend responsibilities:
- render the latest match view returned by the backend
- compute local presentation helpers such as legal highlight states
- keep interaction feedback readable and fast
- avoid leaking hidden state through labels or stale rendering

### `shared`
- common types and helpers that are safe to reuse across modules

### `ai`
- frontend wrappers for backend-served AI-related endpoints when needed

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
- create matches and assign squads
- own authoritative piece positions, weapons, roles, and alive state
- resolve reveal completion and role assignment
- validate movement and adjacency
- resolve duels, ties, decoy behavior, and flag capture
- project viewer-specific match state
- execute AI turns with validation and fallback
- expose debug-friendly event logs for gameplay tracing

No database is part of the MVP. Match state is currently in-memory.

---

## 7. Data Contracts

Canonical backend concepts:

```ts
type Owner = "player" | "ai";
type Difficulty = "easy" | "medium" | "hard";
type Phase = "setup" | "reveal" | "player_turn" | "ai_turn" | "repick" | "finished";

interface VisiblePiece {
  id: string;
  owner: Owner;
  row: number;
  col: number;
  alive: boolean;
  label: string;
  weapon: "rock" | "paper" | "scissors" | null;
  weaponIcon: string | null;
  role: "soldier" | "flag" | "decoy" | null;
  roleIcon: string | null;
  silhouette: boolean;
}

interface MatchView {
  matchId: string;
  phase: Phase;
  currentTurn: Owner | "none";
  difficulty: Difficulty;
  message: string;
  board: VisiblePiece[];
  stats: {
    durationSeconds: number;
    playerDuelsWon: number;
    playerDuelsLost: number;
    tieSequences: number;
    decoyAbsorbed: number;
  };
  duel: DuelSummary | null;
  repick?: { attackerId: string; targetId: string; picksReceived?: string[] };
  result: { winner: Owner; reason: string } | null;
  eventLog?: Array<{ turn: number; message: string }>;
}
```

Contract rules:
- the frontend receives only viewer-scoped state
- dead pieces may exist in payload history, but only alive pieces may occupy visible cells
- tie repicks use temporary duel weapons and must not mutate canonical piece weapons

---

## 8. Core Flows

### Match Start
1. Frontend requests `POST /api/match/create`
2. Backend generates squads and starts reveal phase
3. Frontend renders visible reveal board and countdown

### Reveal Completion
1. Frontend or test helper triggers `POST /api/match/{id}/reveal/complete`
2. Backend assigns roles and switches to player turn
3. Frontend re-renders with hidden enemy state and player-visible roles

### Player Move
1. Player selects a legal piece
2. Frontend highlights legal move targets
3. Frontend sends `POST /api/match/{id}/turn/player-move`
4. Backend validates move and returns the updated match view

### Player Attack
1. Player selects a legal piece
2. Frontend highlights legal adjacent enemy targets
3. Frontend sends `POST /api/match/{id}/turn/player-attack`
4. Backend validates adjacency and resolves the duel
5. Frontend renders duel summary and updated board state

### Tie Repick
1. Duel ties
2. Backend enters `repick` state
3. Frontend renders repick controls
4. Backend resolves repick without mutating canonical weapons

### AI Turn
1. Frontend detects `ai_turn`
2. Frontend calls `POST /api/match/{id}/turn/ai-move`
3. Backend validates Claude output or falls back to a legal action
4. Frontend renders the returned authoritative state

---

## 9. Non-Functional Requirements

- Accessibility: keyboard-reachable controls, readable focus states, reduced-motion-safe behavior
- Performance: no unnecessary full-board confusion from stale dead-piece rendering
- Reliability: invalid moves and attacks fail explicitly, not silently
- Security: backend-only secrets and backend-owned hidden-info projection
- Observability: event log must be good enough to debug live board behavior during demos

---

## 10. Testing Matrix

| Level | Scope | Owner |
|---|---|---|
| Frontend unit/integration | `useGame`, board interaction states, error feedback, debug-log rendering | DEV + QA |
| Backend API tests | reveal, movement, attack legality, tie repick, decoy behavior, flag death, hidden-info projection | DEV + QA |
| E2E | start match, reveal completion, move, duel, result | QA |

Critical checks:
- `rock`, `paper`, `scissors` always resolve correctly
- tie repicks do not mutate canonical weapons
- illegal attacks are rejected
- illegal moves are rejected
- dead pieces never overwrite alive board cells in the client
- hidden enemy state remains hidden until legally revealed

---

## 11. Open Architectural Tasks

- align the remaining docs with the current backend-authoritative game
- decide the formal stalemate policy for decoy-only end states
- decide whether movement remains a permanent MVP rule or is revised later
- expand browser-level tests to cover the full demo loop
