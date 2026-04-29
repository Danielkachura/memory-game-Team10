from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Difficulty = Literal["easy", "medium", "hard"]
Weapon = Literal["rock", "paper", "scissors"]


class SquadGenerateRequest(BaseModel):
    difficulty: Difficulty = "medium"


class MatchCreateRequest(BaseModel):
    difficulty: Difficulty = "medium"


class RevealCompleteRequest(BaseModel):
    confirmed: bool = True


class PlayerAttackRequest(BaseModel):
    attacker_id: str = Field(alias="attackerId")
    target_id: str = Field(alias="targetId")


class TieRepickRequest(BaseModel):
    weapon: Weapon

