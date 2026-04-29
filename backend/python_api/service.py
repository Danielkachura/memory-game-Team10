from __future__ import annotations

import json
import os
from typing import Any
from urllib import error, request

from .config import MAX_TOKENS, MODEL, TIMEOUT_SECONDS


class ClaudeProxyError(Exception):
    pass


def _build_anthropic_request(feature: str, prompt: str) -> request.Request:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ClaudeProxyError("Missing ANTHROPIC_API_KEY.")

    body = {
        "model": MODEL,
        "max_tokens": MAX_TOKENS[feature],
        "messages": [{"role": "user", "content": prompt}],
    }

    return request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )


def call_anthropic(feature: str, prompt: str) -> str:
    anthropic_request = _build_anthropic_request(feature, prompt)

    try:
        with request.urlopen(anthropic_request, timeout=TIMEOUT_SECONDS) as response:
            payload = response.read().decode("utf-8")
    except error.HTTPError as exc:
        raise ClaudeProxyError(f"Anthropic request failed with status {exc.code}.") from exc
    except error.URLError as exc:
        raise ClaudeProxyError("Anthropic request failed.") from exc
    except TimeoutError as exc:
        raise ClaudeProxyError("Anthropic request timed out.") from exc

    decoded = json.loads(payload)
    content: list[dict[str, Any]] = decoded.get("content", [])
    text = next(
        (
            item.get("text", "").strip()
            for item in content
            if item.get("type") == "text" and isinstance(item.get("text"), str)
        ),
        "",
    )

    if not text:
        raise ClaudeProxyError("Anthropic returned no text.")

    return text
