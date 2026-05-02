from __future__ import annotations

import json
import random
import time
import uuid
from copy import deepcopy
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import AI_TIMEOUT_SECONDS, REVEAL_SECONDS
from .schemas import (
    MatchCreateRequest,
    PlayerMoveRequest,
    RevealCompleteRequest,
    SquadGenerateRequest,
    TieRepickRequest,
    Weapon,
)
from .service import ClaudeProxyError, call_claude_text

app = FastAPI(title="Squad RPS Python API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:5176", "http://127.0.0.1:5176"],
    allow_methods=["*"],
    allow_headers=["*"],
)

Owner = Literal["player", "ai"]
Role  = Literal["soldier", "flag", "decoy"]
Phase = Literal["setup", "reveal", "player_turn", "ai_turn", "repick", "finished"]

BOARD_COLS = 5
BOARD_ROWS = 6

WEAPONS: list[Weapon] = ["rock", "paper", "scissors"]
WEAPON_ICON = {"rock": "🪨", "paper": "📄", "scissors": "✂️"}
ROLE_ICON   = {"flag": "🚩", "decoy": "🎭", "soldier": "•"}
MATCHES: dict[str, dict[str, Any]] = {}

PLAYER_NAMES = [
    "Captain Quartz", "Paper Lantern", "Scissor Jack",
    "Ribbon Riot",    "Pebble Nova",   "Ink Talon",
    "Chisel Bloom",   "Origami Volt",  "Velvet Fang",
    "Static Ace",
]

AI_NAMES = [
    "Oracle Flint", "Fable Sheet", "Razor Moth",
    "Cipher Ribbon","Gravel Echo", "Signal Veil",
    "Chrome Snip",  "Banner Ghost","Prism Grit",
    "Comet Shear",
]


def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.add_api_route("/health", healthcheck, methods=["GET"])


# ── Board helpers ────────────────────────────────────────────────────

def is_adjacent(piece: dict[str, Any], row: int, col: int) -> bool:
    dr = abs(piece["row"] - row)
    dc = abs(piece["col"] - col)
    return (dr == 1 and dc == 0) or (dr == 0 and dc == 1)


def find_piece_at(match_state: dict[str, Any], row: int, col: int) -> dict[str, Any] | None:
    return next(
        (p for p in match_state["pieces"] if p["alive"] and p["row"] == row and p["col"] == col),
        None,
    )


def get_valid_moves(piece: dict[str, Any], match_state: dict[str, Any]) -> list[dict[str, int]]:
    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    moves: list[dict[str, int]] = []
    for dr, dc in dirs:
        r, c = piece["row"] + dr, piece["col"] + dc
        if not (1 <= r <= BOARD_ROWS and 1 <= c <= BOARD_COLS):
            continue
        occ = find_piece_at(match_state, r, c)
        if occ is None or occ["owner"] != piece["owner"]:
            moves.append({"row": r, "col": c})
    return moves


# ── Squad generation ────────────────────────────────────────────────

def balanced_weapons() -> list[Weapon]:
    weapons: list[Weapon] = ["rock", "rock", "rock", "rock",
                              "paper", "paper", "paper",
                              "scissors", "scissors", "scissors"]
    random.shuffle(weapons)
    return weapons


def build_piece(owner: Owner, name: str, weapon: Weapon, row: int, col: int) -> dict[str, Any]:
    return {
        "id":     f"{owner}-{uuid.uuid4().hex[:8]}",
        "owner":  owner,
        "name":   name,
        "weapon": weapon,
        "role":   "soldier",
        "row":    row,
        "col":    col,
        "alive":  True,
    }


def fallback_squads() -> dict[str, list[dict[str, Any]]]:
    player_weapons = balanced_weapons()
    ai_weapons     = balanced_weapons()
    player_pieces: list[dict[str, Any]] = []
    ai_pieces:     list[dict[str, Any]] = []

    for index, name in enumerate(PLAYER_NAMES):
        row = 1 if index < 5 else 2
        col = (index % 5) + 1
        player_pieces.append(build_piece("player", name, player_weapons[index], row, col))

    for index, name in enumerate(AI_NAMES):
        row = BOARD_ROWS if index < 5 else BOARD_ROWS - 1
        col = (index % 5) + 1
        ai_pieces.append(build_piece("ai", name, ai_weapons[index], row, col))

    return {"player": player_pieces, "ai": ai_pieces}


def generate_squads_with_claude() -> dict[str, list[dict[str, Any]]]:
    prompt = (
        "Generate JSON only. Create two squads named player and ai for a 1-vs-AI rock-paper-scissors "
        "squad battle. Each squad must contain exactly 10 characters. Each character needs name, "
        "weapon, and description. Weapons must be balanced so each squad has at least 2 rock, 2 paper, "
        "and 2 scissors. Allowed weapons: rock, paper, scissors."
    )
    text   = call_claude_text(prompt, 600)
    parsed = json.loads(text)
    if not isinstance(parsed, dict) or "player" not in parsed or "ai" not in parsed:
        raise ClaudeProxyError("Invalid squad payload.")

    squads = fallback_squads()
    for owner in ("player", "ai"):
        roster = parsed.get(owner)
        if not isinstance(roster, list) or len(roster) != 10:
            raise ClaudeProxyError("Invalid squad size.")
        for index, item in enumerate(roster):
            if not isinstance(item, dict):
                raise ClaudeProxyError("Invalid squad member.")
            weapon      = item.get("weapon")
            name        = item.get("name")
            description = item.get("description")
            if weapon not in WEAPONS or not isinstance(name, str):
                raise ClaudeProxyError("Invalid squad member fields.")
            squads[owner][index]["weapon"]      = weapon
            squads[owner][index]["name"]        = name.strip()[:40]
            squads[owner][index]["description"] = str(description or "").strip()[:80]
    return squads


def generate_squads() -> dict[str, list[dict[str, Any]]]:
    try:
        return generate_squads_with_claude()
    except Exception:
        return fallback_squads()


# ── Role assignment ────────────────────────────────────────────────

def assign_roles(match_state: dict[str, Any]) -> None:
    for owner in ("player", "ai"):
        pieces                   = [p for p in match_state["pieces"] if p["owner"] == owner]
        flag_piece, decoy_piece  = random.sample(pieces, 2)
        flag_piece["role"]       = "flag"
        decoy_piece["role"]      = "decoy"


# ── View helpers ───────────────────────────────────────────────────

def stats_view(match_state: dict[str, Any]) -> dict[str, Any]:
    duration = int(time.time() - match_state["started_at"])
    return {
        "durationSeconds": duration,
        "playerDuelsWon":  match_state["stats"]["player_duels_won"],
        "playerDuelsLost": match_state["stats"]["player_duels_lost"],
        "tieSequences":    match_state["stats"]["tie_sequences"],
        "decoyAbsorbed":   match_state["stats"]["decoy_absorbed"],
    }


def visible_piece(piece: dict[str, Any], viewer: Owner, phase: Phase, finished: bool) -> dict[str, Any]:
    is_owner   = piece["owner"] == viewer
    reveal_all = finished
    show_weapon = phase == "reveal" or is_owner or reveal_all
    show_role   = (is_owner and phase != "reveal") or (reveal_all and piece["role"] != "soldier")

    label = piece["name"] if is_owner or reveal_all else "Hidden Operative"

    return {
        "id":         piece["id"],
        "owner":      piece["owner"],
        "row":        piece["row"],
        "col":        piece["col"],
        "alive":      piece["alive"],
        "label":      label,
        "weapon":     piece["weapon"]          if show_weapon and piece["alive"] else None,
        "weaponIcon": WEAPON_ICON[piece["weapon"]] if show_weapon and piece["alive"] else None,
        "role":       piece["role"]            if show_role   and piece["alive"] else None,
        "roleIcon":   ROLE_ICON[piece["role"]] if show_role   and piece["alive"] else None,
        "silhouette": not show_weapon and piece["alive"],
    }


def build_player_view(match_state: dict[str, Any]) -> dict[str, Any]:
    finished = match_state["phase"] == "finished"
    board    = [
        visible_piece(p, "player", match_state["phase"], finished)
        for p in match_state["pieces"]
    ]

    response: dict[str, Any] = {
        "matchId":     match_state["id"],
        "phase":       match_state["phase"],
        "currentTurn": match_state["current_turn"],
        "difficulty":  match_state["difficulty"],
        "message":     match_state["message"],
        "board":       board,
        "stats":       stats_view(match_state),
        "revealEndsAt":match_state["reveal_ends_at"],
        "duel":        match_state.get("last_duel"),
        "result":      match_state.get("result"),
    }
    if match_state["phase"] == "repick":
        response["repick"] = {
            "attackerId": match_state["pending_repick"]["attacker_id"],
            "targetId":   match_state["pending_repick"]["target_id"],
        }
    return response


def match_or_404(match_id: str) -> dict[str, Any]:
    match_state = MATCHES.get(match_id)
    if not match_state:
        raise HTTPException(status_code=404, detail="Match not found.")
    return match_state


# ── Combat resolution ──────────────────────────────────────────────

def duel_result(
    attacker: dict[str, Any],
    defender: dict[str, Any],
    attacker_weapon: Weapon,
    defender_weapon: Weapon,
) -> Literal["attacker", "defender", "tie"]:
    if attacker_weapon == defender_weapon:
        return "tie"
    wins = {("rock", "scissors"), ("paper", "rock"), ("scissors", "paper")}
    return "attacker" if (attacker_weapon, defender_weapon) in wins else "defender"


def end_match(match_state: dict[str, Any], winner: Owner, reason: str) -> None:
    match_state["phase"]        = "finished"
    match_state["current_turn"] = "none"
    match_state["result"]       = {"winner": winner, "reason": reason}
    match_state["message"]      = reason


def apply_duel_outcome(
    match_state: dict[str, Any],
    attacker:    dict[str, Any],
    defender:    dict[str, Any],
    winner:      Literal["attacker", "defender"],
    attacker_weapon: Weapon,
    defender_weapon: Weapon,
    initiated_by: Owner,
) -> None:
    duel: dict[str, Any] = {
        "attackerId":      attacker["id"],
        "attackerName":    attacker["name"],
        "attackerWeapon":  attacker_weapon,
        "defenderId":      defender["id"],
        "defenderName":    defender["name"],
        "defenderWeapon":  defender_weapon,
        "winner":          winner,
        "tie":             False,
        "decoyAbsorbed":   False,
    }
    attacker["weapon"] = attacker_weapon
    defender["weapon"] = defender_weapon

    match_state["known_player_weapons"][attacker["id"]] = attacker_weapon
    match_state["known_ai_weapons"][defender["id"]]     = defender_weapon

    if winner == "attacker":
        if defender["role"] == "decoy":
            duel["decoyAbsorbed"] = True
            match_state["stats"]["decoy_absorbed"] += 1
            match_state["message"] = f"{defender['name']} was the Decoy and absorbed the attack."
        else:
            defender["alive"]    = False
            duel["eliminatedId"] = defender["id"]
            duel["revealedRole"] = defender["role"]
            if attacker["owner"] == "player":
                match_state["stats"]["player_duels_won"] += 1
            else:
                match_state["stats"]["player_duels_lost"] += 1
            if defender["role"] == "flag":
                end_match(
                    match_state,
                    attacker["owner"],
                    "Enemy flag captured." if attacker["owner"] == "player" else "Your flag was defeated.",
                )
            else:
                match_state["message"] = f"{attacker['name']} won the duel."
    else:
        attacker["alive"]    = False
        duel["eliminatedId"] = attacker["id"]
        duel["revealedRole"] = attacker["role"]
        if attacker["owner"] == "player":
            match_state["stats"]["player_duels_lost"] += 1
        else:
            match_state["stats"]["player_duels_won"] += 1
        if attacker["role"] == "flag":
            end_match(
                match_state,
                defender["owner"],
                "Your flag was defeated." if defender["owner"] == "ai" else "Enemy flag captured.",
            )
        else:
            match_state["message"] = f"{defender['name']} defended successfully."

    if match_state["phase"] != "finished":
        match_state["phase"]        = "ai_turn"   if initiated_by == "player" else "player_turn"
        match_state["current_turn"] = "ai"         if initiated_by == "player" else "player"
    match_state["last_duel"] = duel


def resolve_attack(
    match_state:     dict[str, Any],
    attacker:        dict[str, Any],
    defender:        dict[str, Any],
    initiated_by:    Owner,
    attacker_weapon: Weapon | None = None,
    defender_weapon: Weapon | None = None,
) -> None:
    aw = attacker_weapon or attacker["weapon"]
    dw = defender_weapon or defender["weapon"]
    outcome = duel_result(attacker, defender, aw, dw)

    if outcome == "tie":
        match_state["phase"]        = "repick"
        match_state["current_turn"] = initiated_by
        match_state["stats"]["tie_sequences"] += 1
        match_state["message"]   = "Tie. Pick a new weapon to continue the duel."
        match_state["last_duel"] = {
            "attackerId":     attacker["id"],
            "attackerName":   attacker["name"],
            "attackerWeapon": aw,
            "defenderId":     defender["id"],
            "defenderName":   defender["name"],
            "defenderWeapon": dw,
            "winner":         "tie",
            "tie":            True,
            "decoyAbsorbed":  False,
        }
        match_state["pending_repick"] = {
            "attacker_id":      attacker["id"],
            "target_id":        defender["id"],
            "initiated_by":     initiated_by,
            "attacker_weapon":  aw,
            "defender_weapon":  dw,
        }
        return

    match_state["pending_repick"] = None
    apply_duel_outcome(match_state, attacker, defender, outcome, aw, dw, initiated_by)


# ── Movement helpers ───────────────────────────────────────────────

def execute_move(
    match_state: dict[str, Any],
    piece:       dict[str, Any],
    target_row:  int,
    target_col:  int,
    initiated_by: Owner,
) -> None:
    """Move piece to target. Triggers duel if square is occupied by an enemy."""
    occupant = find_piece_at(match_state, target_row, target_col)

    if occupant is not None and occupant["owner"] == piece["owner"]:
        # Friendly collision — should never reach here due to endpoint validation,
        # but guard defensively so state is never corrupted.
        return

    if occupant is not None:
        # Enemy piece — trigger RPS duel
        resolve_attack(match_state, piece, occupant, initiated_by)
        # Attacker won: slide into the vacated square
        if piece["alive"] and not occupant["alive"]:
            piece["row"] = target_row
            piece["col"] = target_col
        # Tie: remember target so post-repick can finish the move
        elif match_state["phase"] == "repick":
            match_state["pending_repick"]["move_to"] = {"row": target_row, "col": target_col}
    else:
        # Empty square — move piece and hand the turn over
        piece["row"]    = target_row
        piece["col"]    = target_col
        next_phase      = "ai_turn"    if initiated_by == "player" else "player_turn"
        next_turn       = "ai"         if initiated_by == "player" else "player"
        match_state["phase"]        = next_phase
        match_state["current_turn"] = next_turn
        match_state["message"]      = (
            "AI is choosing..." if initiated_by == "player"
            else "Your turn. Select a piece to move."
        )
        match_state["last_duel"] = None


# ── AI logic ───────────────────────────────────────────────────────

def alive_pieces(match_state: dict[str, Any], owner: Owner) -> list[dict[str, Any]]:
    return [p for p in match_state["pieces"] if p["owner"] == owner and p["alive"]]


def choose_ai_move(match_state: dict[str, Any]) -> tuple[dict[str, Any] | None, int, int, str]:
    """Returns (piece, target_row, target_col, reasoning).
    Returns (None, 0, 0, ...) when AI has no valid moves (all pieces blocked).
    """
    ai_pieces  = alive_pieces(match_state, "ai")
    if not ai_pieces:
        return None, 0, 0, "AI has no pieces left."

    difficulty = match_state["difficulty"]
    known      = match_state["known_player_weapons"]

    attack_moves: list[tuple[dict[str, Any], int, int, dict[str, Any]]] = []
    plain_moves:  list[tuple[dict[str, Any], int, int]]                 = []

    for ai_piece in ai_pieces:
        for mv in get_valid_moves(ai_piece, match_state):
            r, c = mv["row"], mv["col"]
            occ  = find_piece_at(match_state, r, c)
            if occ and occ["owner"] == "player":
                attack_moves.append((ai_piece, r, c, occ))
            else:
                plain_moves.append((ai_piece, r, c))

    # Hard: hunt player flag first
    if difficulty == "hard":
        player_pieces = alive_pieces(match_state, "player")
        player_flag   = next((p for p in player_pieces if p["role"] == "flag"), None)
        if player_flag:
            for ai_piece, r, c, target in attack_moves:
                if target["id"] == player_flag["id"]:
                    return ai_piece, r, c, "AI hunts your flag."

    # Medium / Hard: pick winning attack using remembered weapons
    if difficulty in ("medium", "hard"):
        for ai_piece, r, c, target in attack_moves:
            w = known.get(target["id"])
            if w and duel_result(ai_piece, target, ai_piece["weapon"], w) == "attacker":
                return ai_piece, r, c, "AI used a remembered matchup."

    if attack_moves:
        ai_piece, r, c, _ = random.choice(attack_moves)
        return ai_piece, r, c, "AI attacks."

    if plain_moves:
        ai_piece, r, c = random.choice(plain_moves)
        return ai_piece, r, c, "AI advances."

    return None, 0, 0, "AI has no valid moves."


def choose_ai_move_with_claude(match_state: dict[str, Any]) -> tuple[dict[str, Any], int, int, str]:
    ai_pieces     = alive_pieces(match_state, "ai")
    player_pieces = alive_pieces(match_state, "player")
    valid: list[dict[str, Any]] = []
    for p in ai_pieces:
        for mv in get_valid_moves(p, match_state):
            valid.append({"pieceId": p["id"], "pieceName": p["name"],
                          "weapon": p["weapon"], **mv})

    visible_state = {
        "difficulty":    match_state["difficulty"],
        "validMoves":    valid,
        "playerPieces":  [
            {"id": p["id"], "name": p["name"],
             "knownWeapon": match_state["known_player_weapons"].get(p["id"]),
             "row": p["row"], "col": p["col"]}
            for p in player_pieces
        ],
    }
    prompt = (
        "Choose the AI move in a Stratego-style RPS game. "
        "Return JSON only: {pieceId, targetRow, targetCol, reasoning}. "
        "Choose only from validMoves. "
        f"State: {json.dumps(visible_state)}"
    )
    text     = call_claude_text(prompt, 200)
    parsed   = json.loads(text)
    piece_id = parsed.get("pieceId")
    t_row    = int(parsed["targetRow"])
    t_col    = int(parsed["targetCol"])
    reason   = str(parsed.get("reasoning", "AI used Claude guidance."))[:160]
    piece    = next(p for p in ai_pieces if p["id"] == piece_id)
    return piece, t_row, t_col, reason


# ── Match creation ─────────────────────────────────────────────────

def create_match_state(difficulty: str) -> dict[str, Any]:
    squads     = generate_squads()
    match_id   = uuid.uuid4().hex[:10]
    pieces     = deepcopy(squads["player"]) + deepcopy(squads["ai"])
    started_at = time.time()
    return {
        "id":           match_id,
        "difficulty":   difficulty,
        "phase":        "reveal",
        "current_turn": "player",
        "started_at":   started_at,
        "reveal_ends_at": started_at + REVEAL_SECONDS,
        "message":      "Memorize the enemy squad before the reveal timer ends.",
        "pieces":       pieces,
        "stats": {
            "player_duels_won":  0,
            "player_duels_lost": 0,
            "tie_sequences":     0,
            "decoy_absorbed":    0,
        },
        "known_player_weapons": {},
        "known_ai_weapons":     {},
        "last_duel":            None,
        "pending_repick":       None,
        "result":               None,
    }


# ── Endpoints ──────────────────────────────────────────────────────

@app.post("/api/squad/generate")
def generate_squad_endpoint(_payload: SquadGenerateRequest) -> dict[str, Any]:
    return generate_squads()


@app.post("/api/match/create")
def create_match(payload: MatchCreateRequest) -> dict[str, Any]:
    match_state = create_match_state(payload.difficulty)
    MATCHES[match_state["id"]] = match_state
    return build_player_view(match_state)


@app.post("/api/match/{match_id}/reveal/complete")
def complete_reveal(match_id: str, _payload: RevealCompleteRequest) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    if match_state["phase"] == "reveal":
        assign_roles(match_state)
        match_state["phase"]        = "player_turn"
        match_state["current_turn"] = "player"
        match_state["message"]      = "Your turn. Select a piece to move."
    return build_player_view(match_state)


@app.post("/api/match/{match_id}/turn/player-move")
def player_move(match_id: str, payload: PlayerMoveRequest) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    if match_state["phase"] != "player_turn":
        raise HTTPException(400, "It is not the player's turn.")

    piece = next((p for p in match_state["pieces"]
                  if p["id"] == payload.piece_id and p["alive"] and p["owner"] == "player"), None)
    if not piece:
        raise HTTPException(400, "Invalid piece.")

    if not is_adjacent(piece, payload.target_row, payload.target_col):
        raise HTTPException(400, "Target must be exactly one square away (N/S/E/W).")

    if not (1 <= payload.target_row <= BOARD_ROWS and 1 <= payload.target_col <= BOARD_COLS):
        raise HTTPException(400, "Target is out of bounds.")

    occupant = find_piece_at(match_state, payload.target_row, payload.target_col)
    if occupant and occupant["owner"] == "player":
        raise HTTPException(400, "Cannot move onto a friendly piece.")

    execute_move(match_state, piece, payload.target_row, payload.target_col, "player")
    return build_player_view(match_state)


@app.post("/api/match/{match_id}/turn/tie-repick")
def tie_repick(match_id: str, payload: TieRepickRequest) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    pending     = match_state.get("pending_repick")
    if match_state["phase"] != "repick" or not pending:
        raise HTTPException(400, "No tie repick is pending.")

    move_to = pending.get("move_to")

    attacker = next(p for p in match_state["pieces"] if p["id"] == pending["attacker_id"])
    defender = next(p for p in match_state["pieces"] if p["id"] == pending["target_id"])

    # Player always submits their own weapon; derive attacker/defender weapon from initiated_by
    if pending["initiated_by"] == "player":
        # Player was the attacker — payload.weapon is attacker's new weapon
        resolve_attack(match_state, attacker, defender, "player",
                       payload.weapon, random.choice(WEAPONS))
    else:
        # AI was the attacker — payload.weapon is the defender (player)'s new weapon
        resolve_attack(match_state, attacker, defender, "ai",
                       random.choice(WEAPONS), payload.weapon)

    # Slide attacker into vacated square if they won
    if move_to and attacker["alive"] and not defender["alive"]:
        attacker["row"] = move_to["row"]
        attacker["col"] = move_to["col"]

    return build_player_view(match_state)


@app.post("/api/match/{match_id}/turn/ai-move")
def ai_move(match_id: str) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    if match_state["phase"] != "ai_turn":
        raise HTTPException(400, "It is not the AI turn.")

    try:
        piece, t_row, t_col, reasoning = choose_ai_move_with_claude(match_state)
    except Exception:
        piece, t_row, t_col, reasoning = choose_ai_move(match_state)

    if piece is None:
        # AI has no valid moves — pass turn back to player rather than hanging.
        match_state["phase"]        = "player_turn"
        match_state["current_turn"] = "player"
        match_state["message"]      = "Your turn. Select a piece to move."
        match_state["aiReasoning"]  = reasoning
        return build_player_view(match_state)

    execute_move(match_state, piece, t_row, t_col, "ai")
    match_state["aiReasoning"] = reasoning
    return build_player_view(match_state)


@app.get("/api/match/{match_id}")
def get_match(match_id: str) -> dict[str, Any]:
    return build_player_view(match_or_404(match_id))
