# Technical Architecture — Squad RPS
# Team 10 | AIcademy Hackathon 2026

---

## 1. Summary

Squad RPS is a 1-vs-AI browser game built on a hidden-information RPS duel system.
The backend owns all game state and enforces all hidden-information rules.
The frontend renders what the backend exposes and drives user interaction.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | CSS custom properties (no Tailwind dependency on game logic) |
| Backend | Python 3.12 + FastAPI |
| AI | Anthropic Claude `claude-sonnet-4-6` |
| Unit tests (frontend) | Vitest + Testing Library |
| Unit tests (backend) | Python unittest + FastAPI TestClient + httpx |
| E2E | Playwright |

---

## 3. Runtime Topology

```
Browser (React)
    |
    | POST /api/match/create
    | POST /api/match/:id/reveal/complete
    | POST /api/match/:id/turn/player-attack
    | POST /api/match/:id/turn/ai-move
    | POST /api/match/:id/turn/tie-repick
    v
FastAPI Backend (Python) — port 8000
    |
    | POST https://api.anthropic.com/v1/messages
    v
Anthropic Claude API
```

Vite dev server proxies all `/api` calls to `http://127.0.0.1:8000`.

---

## 4. Game State Machine

```
reveal → player_turn → ai_turn → player_turn → ... → finished
              ↑                        ↑
              └─────── repick ─────────┘
```

| Phase | Board state | Clickable |
|---|---|---|
| `reveal` | All weapons shown for 10 seconds | Nothing |
| `player_turn` | Enemy silhouettes only | Player units → then enemy target |
| `ai_turn` | Claude picks move automatically | Nothing |
| `repick` | Tie detected | Weapon buttons only |
| `finished` | Full reveal, all roles shown | Play Again |

---

## 5. Backend Module — `backend/python_api/`

```
backend/python_api/
  app.py        — FastAPI routes + all game logic
  config.py     — Model name, timeouts, reveal duration
  schemas.py    — Pydantic request models
  service.py    — Claude API HTTP client with fallback
  tests/
    test_app.py        — Core match flow tests (create, reveal, attack)
    test_squad_rps.py  — RPS resolution, Decoy stalemate, tie-repick,
                          AI move fallback, hidden-info enforcement
```

### Board Layout

```
Row 6 │ AI    AI    AI    AI    AI   ← AI back row
Row 5 │ AI    AI    AI    AI    AI   ← AI front row
Row 4 │ ·     ·     ·     ·     ·   ← neutral
Row 3 │ ·     ·     ·     ·     ·   ← neutral
Row 2 │ P1    P1    P1    P1    P1   ← Player front row
Row 1 │ P1    P1    P1    P1    P1   ← Player back row
        C1    C2    C3    C4    C5
```

- 10 pieces per side, 20 total
- Each piece: `id`, `owner`, `name`, `weapon`, `role`, `row`, `col`, `alive`

### Hidden-Info Rules (enforced in `visible_piece()`)

| Viewer | What they see |
|---|---|
| Player | Own weapons + own roles (after reveal), enemy = silhouettes |
| AI (server) | Full state — never sent to client directly |
| Both after `finished` | Full reveal — all weapons and non-soldier roles shown |

### Role Assignment

Happens in `assign_roles()` — called once when `reveal → player_turn`.
- 1 Flag per squad (instant loss if defeated)
- 1 Decoy per squad (survives all attacks — role converts to `soldier` if last unit alive to prevent stalemate)

### Duel Resolution

```
resolve_attack()
  ├── duel_result() → "attacker" | "defender" | "tie"
  ├── tie → phase = "repick"
  └── winner →
        apply_duel_outcome()
          ├── Decoy absorbs → stays alive
          ├── Flag dies → end_match()
          └── Soldier dies → removed, check_decoy_stalemate()
```

---

## 6. Frontend Module — `frontend/`

```
frontend/
  app/
    src/
      App.tsx              — entry, renders GameScreen
      main.tsx             — React root
      styles.css           — all CSS (Squad RPS design system)
      App.test.tsx         — UI integration tests
      useGame.test.tsx     — hook reveal-timer test
      squadGame.test.ts    — RPS logic + API contract tests
  modules/
    game/
      src/
        components/
          GameScreen.tsx   — full game UI (setup + board + HUD + sidebar)
        hooks/
          useGame.ts       — all game state, API calls, AI turn loop
        index.ts           — exports GameScreen, useGame
    shared/
      src/
        index.ts           — reserved for future Squad RPS shared utilities
    ai/
      src/
        index.ts           — reserved (Claude handled server-side)
    ui/
      src/                 — reserved for future shared UI components
```

### `useGame.ts` — State Ownership

All game state lives in `useGame`. The component (`GameScreen`) is purely presentational.

Key state:
- `match: MatchView | null` — full server response, drives all rendering
- `selectedAttackerId: string | null` — player selection in progress
- `revealSecondsLeft: number` — countdown timer

Side effects:
- Reveal timer: auto-calls `reveal/complete` when countdown hits zero
- AI turn: auto-calls `ai-move` after 900ms delay when `phase === "ai_turn"`

---

## 7. API Contracts

### POST `/api/match/create`
```json
Request:  { "difficulty": "easy" | "medium" | "hard" }
Response: MatchView
```

### POST `/api/match/:id/reveal/complete`
```json
Request:  { "confirmed": true }
Response: MatchView  (phase → "player_turn", enemy weapons hidden)
```

### POST `/api/match/:id/turn/player-attack`
```json
Request:  { "attackerId": "player-xxx", "targetId": "ai-xxx" }
Response: MatchView  (duel resolved, phase advances)
```

### POST `/api/match/:id/turn/tie-repick`
```json
Request:  { "weapon": "rock" | "paper" | "scissors" }
Response: MatchView  (tie resolved, phase advances)
```

### POST `/api/match/:id/turn/ai-move`
```json
Request:  (empty body)
Response: MatchView  (AI duel resolved, phase → "player_turn")
```

### MatchView shape
```ts
{
  matchId: string
  phase: "reveal" | "player_turn" | "ai_turn" | "repick" | "finished"
  currentTurn: "player" | "ai" | "none"
  difficulty: "easy" | "medium" | "hard"
  message: string
  board: VisiblePiece[]
  stats: { durationSeconds, playerDuelsWon, playerDuelsLost, tieSequences, decoyAbsorbed }
  revealEndsAt: number        // Unix timestamp
  duel: DuelSummary | null
  result: { winner, reason } | null
}
```

---

## 8. Security

- `ANTHROPIC_API_KEY` lives only in the backend environment — never in the frontend bundle
- Enemy hidden state (weapons, roles) is filtered in `visible_piece()` before the response leaves the server
- No raw Claude proxy — all prompts are constructed server-side

---

## 9. Running Locally

```bash
# Terminal 1 — Backend
cd <project-root>
python -m uvicorn backend.python_api.app:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend/app
npm run dev
# → http://localhost:5173
```

---

## 10. Test Commands

```bash
# Backend
python -m pytest backend/python_api/tests/ -v

# Frontend
cd frontend/app && npm test

# E2E (requires both servers running)
cd frontend/app && npm run e2e
```
