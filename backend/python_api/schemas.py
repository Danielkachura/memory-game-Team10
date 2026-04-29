from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ClaudeFeature = Literal["theme", "hint", "narrator"]


class ClaudeRequest(BaseModel):
    feature: ClaudeFeature
    prompt: str = Field(min_length=1)


class ClaudeResponse(BaseModel):
    text: str
