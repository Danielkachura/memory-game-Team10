from __future__ import annotations

from typing import Literal

from pydantic import AliasChoices, BaseModel, Field

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


class PlayerMoveRequest(BaseModel):
    piece_id: str = Field(validation_alias=AliasChoices("pieceId", "attackerId"))
    row: int
    col: int


class TieRepickRequest(BaseModel):
    weapon: Weapon

