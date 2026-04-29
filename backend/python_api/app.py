from __future__ import annotations

from fastapi import FastAPI, HTTPException

from .schemas import ClaudeRequest, ClaudeResponse
from .service import ClaudeProxyError, call_anthropic

app = FastAPI(title="Memory Game Python API")


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/claude", response_model=ClaudeResponse)
def claude_proxy(payload: ClaudeRequest) -> ClaudeResponse:
    try:
        text = call_anthropic(payload.feature, payload.prompt.strip())
    except ClaudeProxyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return ClaudeResponse(text=text)
