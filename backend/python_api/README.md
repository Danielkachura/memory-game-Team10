# Squad RPS Python API

Python backend for Squad RPS game state, duel resolution, and CPU logic.

## Responsibilities

- source of truth for hidden game state (weapons, roles)
- squad generation logic
- AI opponent move selection logic
- RPS duel resolution and hidden-info enforcement

## Local Run

From the repository root:

```bash
python -m uvicorn backend.python_api.app:app --host 127.0.0.1 --port 8000 --reload
```

## Environment

Required:

```bash
PORT=8000
```

Optional:

```bash
RENDER_EXTERNAL_URL=https://your-backend.example.com
```

Note:

- The current backend has no AI/LLM API dependency.
- Keep deployment secrets out of the browser bundle.
