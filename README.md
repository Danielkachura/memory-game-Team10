# Squad RPS — Team 10

משחק טקטי בדפדפן — שחקן מול מחשב, בסגנון RPS Online.
מבנה: React + TypeScript + Vite (frontend) | Python + FastAPI (backend).

---

## הרצה מקומית

```bash
# Terminal 1 — Backend
python -m uvicorn backend.python_api.app:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2 — Frontend
npm --prefix frontend/app install   # פעם ראשונה בלבד
npm --prefix frontend/app run dev
# → http://localhost:5173
```

---

## פקודות

```bash
# Frontend
npm --prefix frontend/app run dev          # dev server
npm --prefix frontend/app run build        # build
npm --prefix frontend/app run test         # unit tests + coverage
npm --prefix frontend/app run test:watch   # watch mode
npm --prefix frontend/app run lint         # TypeScript check

# Backend
python -m pytest backend/python_api/tests/ -v

# E2E (שני השרתים חייבים לרוץ)
npx playwright test
```

---

## מבנה תיקיות

```
frontend/
  app/                    ← Vite app (entry point)
  modules/
    shared/src/           ← Types, constants, utils (pure)
    game/src/
      components/         ← GameScreen, GameBoard, BoardCell, UnitSprite, Sidebar
      hooks/              ← useGame
backend/
  python_api/
    app.py                ← FastAPI routes
    config.py             ← Board constants
    tests/                ← pytest
docs/
  PRD.md                  ← Product requirements
  ARCHITECTURE.md         ← Technical design
  sprints/sprint_01/      ← Current sprint
```

---

## Sprint הנוכחי

**Sprint 01 — Board Foundation**
ראה `docs/sprints/sprint_01/sprint_01_index.md`
