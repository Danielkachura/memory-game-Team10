# Squad RPS Python API

Python backend for the Squad RPS Claude proxy.

## Responsibilities

- secure proxy for Anthropic Claude API
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
ANTHROPIC_API_KEY=sk-ant-...
```

Optional:

```bash
ANTHROPIC_TIMEOUT_SECONDS=8
ANTHROPIC_MODEL=claude-sonnet-4-6
```
