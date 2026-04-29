from __future__ import annotations

import os

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
TIMEOUT_SECONDS = float(os.getenv("ANTHROPIC_TIMEOUT_SECONDS", "8"))
MAX_TOKENS = {
    "theme": 300,
    "hint": 150,
    "narrator": 100,
}
