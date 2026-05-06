# Technical Architecture — Squad RPS Team 10

---

## סטאק

| שכבה | טכנולוגיה |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | CSS custom properties (ללא Tailwind בלוגיקת משחק) |
| Backend | Python 3.12 + FastAPI |
| יריב מחשב | לוגיקה מקומית — ללא AI API |
| Unit tests (frontend) | Vitest |
| Unit tests (backend) | pytest + FastAPI TestClient |
| E2E | Playwright |

---

## Layout — Runtime

```
Browser (React)
    |
    | POST /api/match/create
    | POST /api/match/:id/reveal/complete
    | POST /api/match/:id/turn/player-attack
    | POST /api/match/:id/turn/cpu-move
    | POST /api/match/:id/turn/tie-repick
    v
FastAPI Backend (Python) — port 8000
```

Vite dev server proxies כל `/api` ל-`http://127.0.0.1:8000`.

---

## מבנה לוח

```
Row 6 │ CPU  CPU  CPU  CPU  CPU  ← שורה אחורית CPU
Row 5 │ CPU  CPU  CPU  CPU  CPU  ← שורה קדמית CPU
Row 4 │ ·    ·    ·    ·    ·    ← neutral zone
Row 3 │ ·    ·    ·    ·    ·    ← neutral zone
Row 2 │ P1   P1   P1   P1   P1   ← שורה קדמית שחקן
Row 1 │ P1   P1   P1   P1   P1   ← שורה אחורית שחקן
        C1   C2   C3   C4   C5
```

- 10 יחידות לצד, 20 בסה"כ
- כל יחידה: `id`, `owner`, `name`, `weapon`, `role`, `row`, `col`, `alive`

---

## מצבי משחק

```
reveal → player_turn ↔ cpu_turn → finished
              ↑              ↑
              └── repick ────┘
```

---

## מבנה Frontend

```
frontend/
  app/
    src/
      App.tsx
      main.tsx
      styles.css        ← CSS variables של RPS Online
  modules/
    game/
      src/
        components/
          GameScreen.tsx
        hooks/
          useGame.ts
    shared/
      src/
        types/index.ts    ← Piece, Owner, Phase, Difficulty
        constants/index.ts ← BOARD_COLS/ROWS, PLAYER_ROWS, CPU_ROWS
```

---

## מבנה Backend

```
backend/python_api/
  app.py        ← FastAPI routes + game logic
  config.py     ← board constants
  schemas.py    ← Pydantic request models
  tests/
    test_app.py
    test_squad_rps.py
```

---

## CPU Opponent — לוגיקה מקומית בלבד

```python
# app.py → choose_cpu_move(difficulty, game_state)
# easy:   random valid move
# medium: remembers revealed weapons, prefers winning matchups
# hard:   remembers + hunts player's Flag
```

אין קריאות חיצוניות. אין API keys.

---

## הרצה מקומית

```bash
# Backend
python -m uvicorn backend.python_api.app:app --host 127.0.0.1 --port 8000 --reload

# Frontend
cd frontend/app && npm run dev
# → http://localhost:5173
```
