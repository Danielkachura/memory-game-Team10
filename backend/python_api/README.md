# Python API

Python backend for the Memory Game Claude proxy.

## Responsibilities

- expose `POST /api/claude`
- validate request payloads
- enforce model and token limits server-side
- call Anthropic with `ANTHROPIC_API_KEY`
- return normalized JSON for the React frontend

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
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```
