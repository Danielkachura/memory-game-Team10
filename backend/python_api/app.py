from __future__ import annotations

import json
import os
import random
import time
import uuid
from copy import deepcopy
from pathlib import Path
from typing import Any, Literal, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import AI_TIMEOUT_SECONDS, REVEAL_SECONDS
from .schemas import (
    ClaudeProxyRequest,
    LobbyCreateRequest,
    LobbyJoinRequest,
    MatchCreateRequest,
    PlayerAttackRequest,
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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to the pre-built React frontend; resolved at module load time.
_DIST = Path(__file__).resolve().parent.parent.parent / "dist"

Owner = Literal["player", "ai"]
Role = Literal["soldier", "flag", "decoy"]
Phase = Literal["setup", "reveal", "player_turn", "ai_turn", "repick", "finished"]
Mode = Literal["ai", "pvp"]

WEAPONS: list[Weapon] = ["rock", "paper", "scissors"]
WEAPON_ICON = {"rock": "🪨", "paper": "📄", "scissors": "✂️"}
ROLE_ICON = {"flag": "🚩", "decoy": "🎭", "soldier": "•"}
MATCHES: dict[str, dict[str, Any]] = {}
# Token registry for PVP. Maps a session token to {match_id, owner, display_name}.
TOKENS: dict[str, dict[str, Any]] = {}
# Lobby registry. lobby_id -> {id, host_name, host_token, guest_name, guest_token, match_id, status, difficulty, created_at}
LOBBIES: dict[str, dict[str, Any]] = {}

PLAYER_NAMES = [
    "Captain Quartz",
    "Paper Lantern",
    "Scissor Jack",
    "Ribbon Riot",
    "Pebble Nova",
    "Ink Talon",
    "Chisel Bloom",
    "Origami Volt",
    "Velvet Fang",
    "Static Ace",
]

AI_NAMES = [
    "Oracle Flint",
    "Fable Sheet",
    "Razor Moth",
    "Cipher Ribbon",
    "Gravel Echo",
    "Signal Veil",
    "Chrome Snip",
    "Banner Ghost",
    "Prism Grit",
    "Comet Shear",
]


def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


def server_info() -> dict[str, Any]:
    import socket as _socket
    try:
        with _socket.socket(_socket.AF_INET, _socket.SOCK_DGRAM) as _s:
            _s.connect(("8.8.8.8", 80))
            lan_ip = _s.getsockname()[0]
    except Exception:
        lan_ip = "127.0.0.1"
    return {"lanIp": lan_ip}


app.add_api_route("/health", healthcheck, methods=["GET"])
app.add_api_route("/api/server-info", server_info, methods=["GET"])


def balanced_weapons() -> list[Weapon]:
    weapons: list[Weapon] = [
        "rock",
        "rock",
        "rock",
        "rock",
        "paper",
        "paper",
        "paper",
        "scissors",
        "scissors",
        "scissors",
    ]
    random.shuffle(weapons)
    return weapons


def weapon_title(weapon: Weapon) -> str:
    return weapon.capitalize()


def public_piece_label(piece: dict[str, Any], viewer: Owner, phase: Phase, finished: bool) -> str:
    is_owner = piece["owner"] == viewer
    if not piece["alive"]:
        if finished:
            role_suffix = f" {piece['role']}" if piece["role"] != "soldier" else ""
            return f"{weapon_title(piece['weapon'])}{role_suffix}"
        return "Defeated unit"
    if finished:
        role_suffix = f" {piece['role']}" if piece["role"] != "soldier" else ""
        return f"{weapon_title(piece['weapon'])}{role_suffix}"
    if phase == "reveal":
        return weapon_title(piece["weapon"])
    if is_owner:
        role_suffix = f" {piece['role']}" if piece["role"] in ("flag", "decoy") else ""
        return f"{weapon_title(piece['weapon'])}{role_suffix}"
    return "Hidden Operative"


def duel_piece_label(piece: dict[str, Any]) -> str:
    role_suffix = f" {piece['role']}" if piece["role"] in ("flag", "decoy") else ""
    return f"{weapon_title(piece['weapon'])}{role_suffix}".strip()


def debug_piece_name(piece: dict[str, Any]) -> str:
    role_suffix = f" ({piece['role']})" if piece["role"] in ("flag", "decoy") else ""
    return f"{piece['owner']}:{weapon_title(piece['weapon'])}{role_suffix}#{piece['id'][-4:]}"


def append_log(match_state: dict[str, Any], message: str) -> None:
    log = match_state.setdefault("event_log", [])
    log.append({
        "turn": len(log) + 1,
        "message": message,
    })
    if len(log) > 60:
        del log[:-60]


def build_piece(owner: Owner, name: str, weapon: Weapon, row: int, col: int) -> dict[str, Any]:
    return {
        "id": f"{owner}-{uuid.uuid4().hex[:8]}",
        "owner": owner,
        "name": name,
        "weapon": weapon,
        "role": "soldier",
        "row": row,
        "col": col,
        "alive": True,
    }


def position_key(row: int, col: int) -> tuple[int, int]:
    return (row, col)


def fallback_squads() -> dict[str, list[dict[str, Any]]]:
    player_weapons = balanced_weapons()
    ai_weapons = balanced_weapons()
    player_pieces: list[dict[str, Any]] = []
    ai_pieces: list[dict[str, Any]] = []

    for index, name in enumerate(PLAYER_NAMES):
        row = 1 if index < 5 else 2
        col = (index % 5) + 1
        player_pieces.append(build_piece("player", name, player_weapons[index], row, col))

    for index, name in enumerate(AI_NAMES):
        row = 6 if index < 5 else 5
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
    text = call_claude_text(prompt, 600)
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
            weapon = item.get("weapon")
            name = item.get("name")
            description = item.get("description")
            if weapon not in WEAPONS or not isinstance(name, str):
                raise ClaudeProxyError("Invalid squad member fields.")
            squads[owner][index]["weapon"] = weapon
            squads[owner][index]["name"] = name.strip()[:40]
            squads[owner][index]["description"] = str(description or "").strip()[:80]
    return squads


def generate_squads() -> dict[str, list[dict[str, Any]]]:
    try:
        return generate_squads_with_claude()
    except Exception:
        return fallback_squads()


def assign_roles(match_state: dict[str, Any]) -> None:
    for owner in ("player", "ai"):
        pieces = [piece for piece in match_state["pieces"] if piece["owner"] == owner]
        flag_piece, decoy_piece = random.sample(pieces, 2)
        flag_piece["role"] = "flag"
        decoy_piece["role"] = "decoy"


def stats_view(match_state: dict[str, Any]) -> dict[str, Any]:
    duration = int(time.time() - match_state["started_at"])
    return {
        "durationSeconds": duration,
        "playerDuelsWon": match_state["stats"]["player_duels_won"],
        "playerDuelsLost": match_state["stats"]["player_duels_lost"],
        "tieSequences": match_state["stats"]["tie_sequences"],
        "decoyAbsorbed": match_state["stats"]["decoy_absorbed"],
    }


def duel_result(
    attacker: dict[str, Any],
    defender: dict[str, Any],
    attacker_weapon: Weapon,
    defender_weapon: Weapon,
) -> Literal["attacker", "defender", "tie"]:
    if attacker_weapon == defender_weapon:
        return "tie"
    wins = {
        ("rock", "scissors"),
        ("paper", "rock"),
        ("scissors", "paper"),
    }
    return "attacker" if (attacker_weapon, defender_weapon) in wins else "defender"


def visible_piece(piece: dict[str, Any], viewer: Owner, phase: Phase, finished: bool) -> dict[str, Any]:
    is_owner = piece["owner"] == viewer
    reveal_all = finished
    show_weapon = phase == "reveal" or is_owner or reveal_all
    show_role = (is_owner and phase != "reveal") or (reveal_all and piece["role"] != "soldier")

    return {
        "id": piece["id"],
        "owner": piece["owner"],
        "row": piece["row"],
        "col": piece["col"],
        "alive": piece["alive"],
        "label": public_piece_label(piece, viewer, phase, finished),
        "weapon": piece["weapon"] if show_weapon and piece["alive"] else None,
        "weaponIcon": WEAPON_ICON[piece["weapon"]] if show_weapon and piece["alive"] else None,
        "role": piece["role"] if show_role and piece["alive"] else None,
        "roleIcon": ROLE_ICON[piece["role"]] if show_role and piece["alive"] else None,
        "silhouette": not show_weapon and piece["alive"],
    }


def build_player_view(match_state: dict[str, Any], viewer: Owner = "player") -> dict[str, Any]:
    finished = match_state["phase"] == "finished"
    board = [
        visible_piece(piece, viewer, match_state["phase"], finished)
        for piece in match_state["pieces"]
    ]

    response: dict[str, Any] = {
        "matchId": match_state["id"],
        "phase": match_state["phase"],
        "mode": match_state.get("mode", "ai"),
        "viewer": viewer,
        "currentTurn": match_state["current_turn"],
        "difficulty": match_state["difficulty"],
        "message": match_state["message"],
        "board": board,
        "stats": stats_view(match_state),
        "revealEndsAt": match_state["reveal_ends_at"],
        "duel": match_state.get("last_duel"),
        "result": match_state.get("result"),
        "players": match_state.get("players"),
        "eventLog": match_state.get("event_log", []),
    }
    if match_state["phase"] == "repick":
        pending = match_state["pending_repick"]
        response["repick"] = {
            "attackerId": pending["attacker_id"],
            "targetId": pending["target_id"],
            "picksReceived": list((pending.get("picks") or {}).keys()),
        }
    return response


def viewer_for(match_state: dict[str, Any], token: Optional[str]) -> Owner:
    """Resolve the viewing perspective for a request. Solo-vs-AI always shows the human player.
    PVP requires a valid token bound to this match; the token's owner field is the viewer."""
    if match_state.get("mode", "ai") != "pvp":
        return "player"
    if not token:
        raise HTTPException(status_code=401, detail="Missing player token.")
    info = TOKENS.get(token)
    if not info or info["match_id"] != match_state["id"]:
        raise HTTPException(status_code=401, detail="Invalid player token.")
    return info["owner"]


def assert_actor(match_state: dict[str, Any], token: Optional[str]) -> Owner:
    """Same as viewer_for but additionally enforces it is this player's turn (PVP only)."""
    actor = viewer_for(match_state, token)
    if match_state.get("mode") == "pvp" and match_state["current_turn"] != actor:
        # Repick is the one exception: in PVP both players may submit during a tie.
        if match_state["phase"] != "repick":
            raise HTTPException(status_code=403, detail="It is not your turn.")
    return actor


def piece_at(match_state: dict[str, Any], row: int, col: int) -> dict[str, Any] | None:
    return next(
        (
            piece
            for piece in match_state["pieces"]
            if piece["alive"] and piece["row"] == row and piece["col"] == col
        ),
        None,
    )


def valid_move_targets(piece: dict[str, Any]) -> set[tuple[int, int]]:
    row_delta = 1 if piece["owner"] == "player" else -1
    candidates = {
        position_key(piece["row"] + row_delta, piece["col"]),
        position_key(piece["row"], piece["col"] - 1),
        position_key(piece["row"], piece["col"] + 1),
    }
    return {
        (row, col)
        for row, col in candidates
        if 1 <= row <= 6 and 1 <= col <= 5
    }


def adjacent_enemy_targets(match_state: dict[str, Any], piece: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        other
        for other in match_state["pieces"]
        if other["alive"]
        and other["owner"] != piece["owner"]
        and abs(other["row"] - piece["row"]) + abs(other["col"] - piece["col"]) == 1
    ]


def match_or_404(match_id: str) -> dict[str, Any]:
    match_state = MATCHES.get(match_id)
    if not match_state:
        raise HTTPException(status_code=404, detail="Match not found.")
    return match_state


def end_match(match_state: dict[str, Any], winner: Owner, reason: str) -> None:
    match_state["phase"] = "finished"
    match_state["current_turn"] = "none"
    match_state["result"] = {"winner": winner, "reason": reason}
    match_state["message"] = reason
    append_log(match_state, f"Match finished. Winner: {winner}. Reason: {reason}")


def apply_duel_outcome(
    match_state: dict[str, Any],
    attacker: dict[str, Any],
    defender: dict[str, Any],
    winner: Literal["attacker", "defender"],
    attacker_weapon: Weapon,
    defender_weapon: Weapon,
    initiated_by: Owner,
) -> None:
    duel: dict[str, Any] = {
        "attackerId": attacker["id"],
        "attackerName": duel_piece_label(attacker),
        "attackerWeapon": attacker_weapon,
        "defenderId": defender["id"],
        "defenderName": duel_piece_label(defender),
        "defenderWeapon": defender_weapon,
        "winner": winner,
        "tie": False,
        "decoyAbsorbed": False,
    }
    # NOTE: do NOT mutate piece["weapon"] here. Tie-repicks pick a fresh weapon
    # for that exchange only. Persisting them silently changed each piece's
    # canonical weapon after every duel and produced wrong outcomes later.

    if attacker["owner"] == "player":
        match_state["known_player_weapons"][attacker["id"]] = attacker_weapon
        match_state["known_ai_weapons"][defender["id"]] = defender_weapon
    else:
        match_state["known_ai_weapons"][attacker["id"]] = attacker_weapon
        match_state["known_player_weapons"][defender["id"]] = defender_weapon

    if winner == "attacker":
        if defender["role"] == "decoy":
            duel["decoyAbsorbed"] = True
            match_state["stats"]["decoy_absorbed"] += 1
            match_state["message"] = "The decoy absorbed the attack and stayed on the board."
        else:
            defender["alive"] = False
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
                match_state["message"] = "Your attack succeeded." if attacker["owner"] == "player" else "Claude won the duel."
            append_log(
                match_state,
                f"Duel: {debug_piece_name(attacker)} defeated {debug_piece_name(defender)} with "
                f"{weapon_title(attacker_weapon)} vs {weapon_title(defender_weapon)}.",
            )
    else:
        attacker["alive"] = False
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
            match_state["message"] = "Claude defended successfully." if defender["owner"] == "ai" else "Your defense succeeded."
        append_log(
            match_state,
            f"Duel: {debug_piece_name(defender)} defended against {debug_piece_name(attacker)} with "
            f"{weapon_title(defender_weapon)} over {weapon_title(attacker_weapon)}.",
        )

    if match_state["phase"] != "finished":
        next_owner: Owner = "ai" if initiated_by == "player" else "player"
        match_state["current_turn"] = next_owner
        # In PVP both turns are human turns — keep phase as player_turn so the
        # frontend AI auto-move never fires.
        if match_state.get("mode") == "pvp":
            match_state["phase"] = "player_turn"
        else:
            match_state["phase"] = "ai_turn" if next_owner == "ai" else "player_turn"
    match_state["last_duel"] = duel


def resolve_attack(
    match_state: dict[str, Any],
    attacker: dict[str, Any],
    defender: dict[str, Any],
    initiated_by: Owner,
    attacker_weapon: Weapon | None = None,
    defender_weapon: Weapon | None = None,
) -> None:
    duel_winner = duel_result(
        attacker,
        defender,
        attacker_weapon or attacker["weapon"],
        defender_weapon or defender["weapon"],
    )
    if duel_winner == "tie":
        match_state["phase"] = "repick"
        match_state["current_turn"] = initiated_by
        match_state["pending_repick"] = {
            "attacker_id": attacker["id"],
            "target_id": defender["id"],
            "initiated_by": initiated_by,
            "attacker_weapon": attacker_weapon or attacker["weapon"],
            "defender_weapon": defender_weapon or defender["weapon"],
        }
        match_state["stats"]["tie_sequences"] += 1
        match_state["message"] = "Tie. Pick a new weapon to continue the duel."
        match_state["last_duel"] = {
            "attackerId": attacker["id"],
            "attackerName": duel_piece_label(attacker),
            "attackerWeapon": attacker_weapon or attacker["weapon"],
            "defenderId": defender["id"],
            "defenderName": duel_piece_label(defender),
            "defenderWeapon": defender_weapon or defender["weapon"],
            "winner": "tie",
            "tie": True,
            "decoyAbsorbed": False,
        }
        append_log(
            match_state,
            f"Duel tie: {debug_piece_name(attacker)} and {debug_piece_name(defender)} both showed "
            f"{weapon_title(attacker_weapon or attacker['weapon'])}. Repick required.",
        )
        return

    match_state["pending_repick"] = None
    apply_duel_outcome(
        match_state,
        attacker,
        defender,
        duel_winner,
        attacker_weapon or attacker["weapon"],
        defender_weapon or defender["weapon"],
        initiated_by,
    )


def alive_pieces(match_state: dict[str, Any], owner: Owner) -> list[dict[str, Any]]:
    return [
        piece
        for piece in match_state["pieces"]
        if piece["owner"] == owner and piece["alive"]
    ]


def movable_pieces(match_state: dict[str, Any], owner: Owner) -> list[dict[str, Any]]:
    pieces = alive_pieces(match_state, owner)
    movable: list[dict[str, Any]] = []
    for piece in pieces:
        if any(
            piece_at(match_state, row, col) is None
            for row, col in valid_move_targets(piece)
        ):
            movable.append(piece)
    return movable


def choose_ai_move(match_state: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], str]:
    ai_pieces = alive_pieces(match_state, "ai")
    player_pieces = alive_pieces(match_state, "player")
    difficulty = match_state["difficulty"]
    known = match_state["known_player_weapons"]

    for attacker in ai_pieces:
        adjacent_targets = adjacent_enemy_targets(match_state, attacker)
        for defender in adjacent_targets:
            weapon = known.get(defender["id"], defender["weapon"])
            if difficulty in ("medium", "hard") and weapon and duel_result(attacker, defender, attacker["weapon"], weapon) == "attacker":
                return attacker, defender, "AI used a remembered adjacent matchup."
        if adjacent_targets:
            return attacker, adjacent_targets[0], "AI attacked an adjacent target."

    movers = movable_pieces(match_state, "ai")
    if movers:
        mover = random.choice(movers)
        target_row, target_col = next(
            (row, col)
            for row, col in valid_move_targets(mover)
            if piece_at(match_state, row, col) is None
        )
        return mover, {"row": target_row, "col": target_col}, "AI advanced a piece."

    append_log(match_state, "AI had no legal adjacent attack or movement. Match state needs explicit stalemate handling.")
    raise ValueError("AI has no legal moves.")


def choose_ai_move_with_claude(match_state: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any] | dict[str, int], str]:
    ai_pieces = alive_pieces(match_state, "ai")
    player_pieces = alive_pieces(match_state, "player")
    visible_state = {
        "difficulty": match_state["difficulty"],
        "aiPieces": [
            {
                "id": piece["id"],
                "name": piece["name"],
                "weapon": piece["weapon"],
                "role": piece["role"],
            }
            for piece in ai_pieces
        ],
        "playerPieces": [
            {
                "id": piece["id"],
                "name": piece["name"],
                "knownWeapon": match_state["known_player_weapons"].get(piece["id"]),
            }
            for piece in player_pieces
        ],
        "adjacentTargets": {
            piece["id"]: [target["id"] for target in adjacent_enemy_targets(match_state, piece)]
            for piece in ai_pieces
        },
        "legalMoves": {
            piece["id"]: [
                {"row": row, "col": col}
                for row, col in valid_move_targets(piece)
                if piece_at(match_state, row, col) is None
            ]
            for piece in ai_pieces
        },
        "lastDuel": match_state.get("last_duel"),
    }
    prompt = (
        "You are choosing the AI move for a hidden-information Squad RPS duel. "
        "Return JSON only with action, attackerId, optional targetId, optional row, optional col, reasoning. "
        "Action must be attack or move. Choose only legal adjacent attacks or legal moves from the provided state. "
        f"Visible state: {json.dumps(visible_state)}"
    )
    text = call_claude_text(prompt, 180)
    parsed = json.loads(text)
    action = parsed.get("action")
    attacker_id = parsed.get("attackerId")
    reasoning = str(parsed.get("reasoning", "AI used Claude guidance.")).strip()[:160]
    attacker = next(piece for piece in ai_pieces if piece["id"] == attacker_id)
    if action == "move":
        row = int(parsed.get("row"))
        col = int(parsed.get("col"))
        if position_key(row, col) not in valid_move_targets(attacker) or piece_at(match_state, row, col) is not None:
            raise ValueError("Illegal AI move.")
        return attacker, {"row": row, "col": col}, reasoning or "AI moved with Claude guidance."

    target_id = parsed.get("targetId")
    defender = next(piece for piece in player_pieces if piece["id"] == target_id)
    if defender not in adjacent_enemy_targets(match_state, attacker):
        raise ValueError("Illegal AI attack.")
    return attacker, defender, reasoning or "AI used Claude guidance."


def create_match_state(
    difficulty: str,
    mode: str = "ai",
    players: dict[str, str] | None = None,
) -> dict[str, Any]:
    squads = generate_squads()
    match_id = uuid.uuid4().hex[:10]
    pieces = deepcopy(squads["player"]) + deepcopy(squads["ai"])
    seen_cells: set[tuple[int, int]] = set()
    for piece in pieces:
        cell = (piece["row"], piece["col"])
        if cell in seen_cells:
            raise HTTPException(status_code=500, detail="Duplicate starting cell in squad layout.")
        seen_cells.add(cell)
    started_at = time.time()
    return {
        "id": match_id,
        "difficulty": difficulty,
        "mode": mode,
        "players": players or {"player": "You", "ai": "Claude"},
        "phase": "reveal",
        "current_turn": "player",
        "started_at": started_at,
        "reveal_ends_at": started_at + REVEAL_SECONDS,
        "message": "Memorize the enemy squad before the reveal timer ends.",
        "pieces": pieces,
        "stats": {
            "player_duels_won": 0,
            "player_duels_lost": 0,
            "tie_sequences": 0,
            "decoy_absorbed": 0,
        },
        "known_player_weapons": {},
        "known_ai_weapons": {},
        "last_duel": None,
        "pending_repick": None,
        "result": None,
        "event_log": [],
    }


def apply_move(match_state: dict[str, Any], piece: dict[str, Any], row: int, col: int, owner: Owner) -> None:
    from_row = piece["row"]
    from_col = piece["col"]
    piece["row"] = row
    piece["col"] = col
    match_state["last_duel"] = None
    match_state["message"] = (
        "Move complete. Pick your next action." if owner == "player" else "Claude advanced a piece."
    )
    next_owner: Owner = "ai" if owner == "player" else "player"
    match_state["current_turn"] = next_owner
    if match_state.get("mode") == "pvp":
        match_state["phase"] = "player_turn"
    else:
        match_state["phase"] = "ai_turn" if next_owner == "ai" else "player_turn"
    append_log(
        match_state,
        f"Move: {debug_piece_name(piece)} moved from R{from_row}C{from_col} to R{row}C{col}. Next turn: {next_owner}.",
    )


_FEATURE_MAX_TOKENS: dict[str, int] = {"theme": 300, "hint": 150, "narrator": 100}


@app.post("/api/claude")
def claude_proxy(payload: ClaudeProxyRequest) -> dict[str, str]:
    max_tokens = _FEATURE_MAX_TOKENS.get(payload.feature, 300)
    try:
        text = call_claude_text(payload.prompt, max_tokens)
    except ClaudeProxyError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return {"text": text}


@app.post("/api/squad/generate")
def generate_squad_endpoint(_payload: SquadGenerateRequest) -> dict[str, Any]:
    return generate_squads()


@app.post("/api/match/create")
def create_match(payload: MatchCreateRequest) -> dict[str, Any]:
    # Solo-vs-AI matches are created here. PVP matches are created via /api/lobby/{id}/join.
    if payload.mode == "pvp":
        raise HTTPException(status_code=400, detail="PVP matches must be created via the lobby.")
    match_state = create_match_state(payload.difficulty, "ai")
    append_log(match_state, f"Match created. Mode: ai. Difficulty: {payload.difficulty}. Reveal started.")
    MATCHES[match_state["id"]] = match_state
    return build_player_view(match_state)


@app.post("/api/match/{match_id}/reveal/complete")
def complete_reveal(
    match_id: str,
    _payload: RevealCompleteRequest,
    x_player_token: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    viewer = viewer_for(match_state, x_player_token)
    if match_state["phase"] == "reveal":
        assign_roles(match_state)
        match_state["phase"] = "player_turn"
        match_state["current_turn"] = "player"
        if match_state.get("mode") == "pvp":
            host_name = match_state["players"].get("player", "Player 1")
            match_state["message"] = f"{host_name}'s turn. Pick a piece and act."
        else:
            match_state["message"] = "Your turn. Pick an attacker and an enemy target."
        append_log(match_state, "Reveal ended. Roles assigned. First turn started.")
    return build_player_view(match_state, viewer)


@app.post("/api/match/{match_id}/turn/player-attack")
def player_attack(
    match_id: str,
    payload: PlayerAttackRequest,
    x_player_token: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    if match_state["phase"] != "player_turn":
        raise HTTPException(status_code=400, detail="It is not a player turn.")
    actor = assert_actor(match_state, x_player_token)

    attacker = next((piece for piece in match_state["pieces"] if piece["id"] == payload.attacker_id), None)
    defender = next((piece for piece in match_state["pieces"] if piece["id"] == payload.target_id), None)
    if not attacker or not defender or not attacker["alive"] or not defender["alive"]:
        raise HTTPException(status_code=400, detail="Invalid duel target.")
    if attacker["owner"] != actor or defender["owner"] == actor:
        raise HTTPException(status_code=400, detail="Invalid attacker or target.")
    if defender not in adjacent_enemy_targets(match_state, attacker):
        raise HTTPException(status_code=400, detail="Target is not adjacent.")

    append_log(
        match_state,
        f"Attack declared: {debug_piece_name(attacker)} at R{attacker['row']}C{attacker['col']} -> "
        f"{debug_piece_name(defender)} at R{defender['row']}C{defender['col']}.",
    )
    resolve_attack(match_state, attacker, defender, actor)
    return build_player_view(match_state, viewer_for(match_state, x_player_token))


@app.post("/api/match/{match_id}/turn/player-move")
def player_move(
    match_id: str,
    payload: PlayerMoveRequest,
    x_player_token: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    if match_state["phase"] != "player_turn":
        raise HTTPException(status_code=400, detail="It is not a player turn.")
    actor = assert_actor(match_state, x_player_token)

    piece = next((candidate for candidate in match_state["pieces"] if candidate["id"] == payload.piece_id), None)
    if not piece or not piece["alive"] or piece["owner"] != actor:
        raise HTTPException(status_code=400, detail="Invalid piece.")

    destination = position_key(payload.row, payload.col)
    if destination not in valid_move_targets(piece):
        raise HTTPException(status_code=400, detail="Illegal move.")
    if piece_at(match_state, payload.row, payload.col) is not None:
        raise HTTPException(status_code=400, detail="Destination is occupied.")

    apply_move(match_state, piece, payload.row, payload.col, actor)
    return build_player_view(match_state, viewer_for(match_state, x_player_token))


@app.post("/api/match/{match_id}/turn/tie-repick")
def tie_repick(
    match_id: str,
    payload: TieRepickRequest,
    x_player_token: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    pending = match_state.get("pending_repick")
    if match_state["phase"] != "repick" or not pending:
        raise HTTPException(status_code=400, detail="No tie repick is pending.")

    attacker = next(piece for piece in match_state["pieces"] if piece["id"] == pending["attacker_id"])
    defender = next(piece for piece in match_state["pieces"] if piece["id"] == pending["target_id"])

    if match_state.get("mode") == "pvp":
        actor = viewer_for(match_state, x_player_token)
        picks: dict[str, Any] = pending.setdefault("picks", {})
        role = "attacker" if attacker["owner"] == actor else "defender"
        if role in picks:
            raise HTTPException(status_code=409, detail="You have already submitted your tie weapon. Waiting for opponent.")
        picks[role] = payload.weapon
        append_log(match_state, f"Tie repick: {actor} locked {weapon_title(payload.weapon)}.")
        if "attacker" in picks and "defender" in picks:
            resolve_attack(
                match_state, attacker, defender,
                pending["initiated_by"], picks["attacker"], picks["defender"],
            )
        else:
            match_state["message"] = "Waiting for the other player to pick their tie weapon."
        return build_player_view(match_state, actor)

    ai_weapon = random.choice(WEAPONS)
    append_log(
        match_state,
        f"Tie repick: player locked {weapon_title(payload.weapon)}; ai locked {weapon_title(ai_weapon)}.",
    )
    resolve_attack(match_state, attacker, defender, pending["initiated_by"], payload.weapon, ai_weapon)
    return build_player_view(match_state)


@app.post("/api/match/{match_id}/turn/ai-move")
def ai_move(match_id: str) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    if match_state.get("mode") == "pvp":
        raise HTTPException(status_code=400, detail="No AI in PVP matches.")
    if match_state["phase"] != "ai_turn":
        raise HTTPException(status_code=400, detail="It is not the AI turn.")
    started = time.time()
    try:
        attacker, action_target, reasoning = choose_ai_move_with_claude(match_state)
    except Exception:
        try:
            attacker, action_target, reasoning = choose_ai_move(match_state)
        except Exception:
            end_match(match_state, "player", "Claude had no legal move available.")
            return build_player_view(match_state)

    if isinstance(action_target, dict) and "row" in action_target and "col" in action_target:
        apply_move(match_state, attacker, int(action_target["row"]), int(action_target["col"]), "ai")
    else:
        append_log(
            match_state,
            f"AI attack declared: {debug_piece_name(attacker)} at R{attacker['row']}C{attacker['col']} -> "
            f"{debug_piece_name(action_target)} at R{action_target['row']}C{action_target['col']}.",
        )
        resolve_attack(match_state, attacker, action_target, "ai")
    if time.time() - started > AI_TIMEOUT_SECONDS:
        match_state["message"] = "AI timed out and used a fallback move."
    match_state["aiReasoning"] = reasoning
    return build_player_view(match_state)


@app.get("/api/match/{match_id}")
def get_match(
    match_id: str,
    x_player_token: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    match_state = match_or_404(match_id)
    viewer = viewer_for(match_state, x_player_token)
    return build_player_view(match_state, viewer)


# ---------------------------------------------------------------------------
# Lobby endpoints (network multiplayer matchmaking)
# ---------------------------------------------------------------------------


def _public_lobby(lobby: dict[str, Any]) -> dict[str, Any]:
    return {
        "lobbyId": lobby["id"],
        "hostName": lobby["host_name"],
        "guestName": lobby.get("guest_name"),
        "difficulty": lobby["difficulty"],
        "status": lobby["status"],
        "matchId": lobby.get("match_id"),
        "createdAt": lobby["created_at"],
    }


@app.get("/api/lobby/list")
def list_lobbies() -> dict[str, Any]:
    open_lobbies = [
        _public_lobby(lobby)
        for lobby in LOBBIES.values()
        if lobby["status"] == "open"
    ]
    open_lobbies.sort(key=lambda item: item["createdAt"], reverse=True)
    return {"lobbies": open_lobbies}


@app.post("/api/lobby/create")
def create_lobby(payload: LobbyCreateRequest) -> dict[str, Any]:
    lobby_id = uuid.uuid4().hex[:8]
    host_token = uuid.uuid4().hex
    lobby = {
        "id": lobby_id,
        "host_name": payload.display_name.strip()[:24],
        "host_token": host_token,
        "guest_name": None,
        "guest_token": None,
        "match_id": None,
        "status": "open",
        "difficulty": payload.difficulty,
        "created_at": time.time(),
    }
    LOBBIES[lobby_id] = lobby
    return {
        "lobbyId": lobby_id,
        "token": host_token,
        "role": "host",
        "displayName": lobby["host_name"],
        "lobby": _public_lobby(lobby),
    }


@app.post("/api/lobby/{lobby_id}/join")
def join_lobby(lobby_id: str, payload: LobbyJoinRequest) -> dict[str, Any]:
    lobby = LOBBIES.get(lobby_id)
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found.")
    if lobby["status"] != "open":
        raise HTTPException(status_code=409, detail="Lobby is no longer open.")

    guest_name = payload.display_name.strip()[:24]
    guest_token = uuid.uuid4().hex
    match_state = create_match_state(
        lobby["difficulty"],
        mode="pvp",
        players={"player": lobby["host_name"], "ai": guest_name},
    )
    append_log(match_state, f"Match created. Mode: pvp. Difficulty: {lobby['difficulty']}. Reveal started.")
    MATCHES[match_state["id"]] = match_state
    TOKENS[lobby["host_token"]] = {
        "match_id": match_state["id"],
        "owner": "player",
        "display_name": lobby["host_name"],
    }
    TOKENS[guest_token] = {
        "match_id": match_state["id"],
        "owner": "ai",
        "display_name": guest_name,
    }
    lobby.update({
        "guest_name": guest_name,
        "guest_token": guest_token,
        "match_id": match_state["id"],
        "status": "started",
    })
    return {
        "lobbyId": lobby_id,
        "token": guest_token,
        "role": "guest",
        "displayName": guest_name,
        "matchId": match_state["id"],
        "lobby": _public_lobby(lobby),
    }


@app.get("/api/lobby/{lobby_id}")
def get_lobby(lobby_id: str) -> dict[str, Any]:
    lobby = LOBBIES.get(lobby_id)
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found.")
    return _public_lobby(lobby)


@app.post("/api/lobby/{lobby_id}/cancel")
def cancel_lobby(lobby_id: str, x_player_token: Optional[str] = Header(default=None)) -> dict[str, Any]:
    lobby = LOBBIES.get(lobby_id)
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found.")
    if lobby["status"] != "open" or lobby["host_token"] != x_player_token:
        raise HTTPException(status_code=403, detail="Cannot cancel this lobby.")
    lobby["status"] = "closed"
    return _public_lobby(lobby)


# SPA static serving — only active in the packaged executable (PyInstaller).
# In dev mode Vite serves the frontend; this block must not run there.
import sys as _sys
if getattr(_sys, "frozen", False) and _DIST.is_dir():
    from starlette.requests import Request
    from starlette.responses import Response

    app.mount("/assets", StaticFiles(directory=str(_DIST / "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    def serve_root() -> FileResponse:
        return FileResponse(str(_DIST / "index.html"))

    @app.exception_handler(404)
    async def spa_fallback(request: Request, exc: Exception) -> Response:
        if request.url.path.startswith("/api/"):
            from starlette.responses import JSONResponse
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        return FileResponse(str(_DIST / "index.html"))
