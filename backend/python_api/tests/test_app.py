import time

import backend.python_api.app as app_module
from backend.python_api.app import MATCHES, app
from fastapi.testclient import TestClient

client = TestClient(app)


def choose_player_flag(created_match: dict, row: int = 1, col: int = 1) -> dict:
    player_piece = next(
        piece for piece in created_match["board"]
        if piece["owner"] == "player" and piece["row"] == row and piece["col"] == col
    )
    response = client.post(
        f"/api/match/{created_match['matchId']}/flag/player",
        json={"pieceId": player_piece["id"]},
    )
    assert response.status_code == 200
    return player_piece


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_match_create_uses_canonical_board_size():
    MATCHES.clear()

    response = client.post("/api/match/create", json={"difficulty": "easy"})

    assert response.status_code == 200
    payload = response.json()
    player_pieces = [piece for piece in payload["board"] if piece["owner"] == "player"]
    ai_pieces = [piece for piece in payload["board"] if piece["owner"] == "ai"]

    assert len(payload["board"]) == 28
    assert len(player_pieces) == 14
    assert len(ai_pieces) == 14
    assert sorted({piece["col"] for piece in player_pieces}) == [1, 2, 3, 4, 5, 6, 7]
    assert sorted({piece["row"] for piece in player_pieces}) == [1, 2]
    assert sorted({piece["row"] for piece in ai_pieces}) == [5, 6]


def test_reveal_complete_requires_player_flag_choice():
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()

    response = client.post(
        f"/api/match/{created['matchId']}/reveal/complete",
        json={"confirmed": True},
    )

    assert response.status_code == 400
    assert "Choose your flag" in response.json()["detail"]


def test_reveal_timeout_without_flag_finishes_match_as_loss():
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()
    state = MATCHES[created["matchId"]]
    state["reveal_ends_at"] = time.time() - 1

    response = client.post(
        f"/api/match/{created['matchId']}/reveal/complete",
        json={"confirmed": True},
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["phase"] == "finished"
    assert payload["result"]["winner"] == "ai"
    assert "Time ran out" in payload["result"]["reason"]


def test_reveal_assigns_one_player_flag_and_one_player_decoy():
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()
    chosen_piece = choose_player_flag(created)

    response = client.post(
        f"/api/match/{created['matchId']}/reveal/complete",
        json={"confirmed": True},
    )

    assert response.status_code == 200
    payload = response.json()
    player_roles = [piece["role"] for piece in payload["board"] if piece["owner"] == "player"]
    revealed_flag = next(piece for piece in payload["board"] if piece["id"] == chosen_piece["id"])

    assert payload["phase"] == "player_turn"
    assert payload["turnEndsAt"] is not None
    assert player_roles.count("flag") == 1
    assert player_roles.count("decoy") == 1
    assert revealed_flag["role"] == "flag"


def test_player_can_shuffle_positions_only_during_reveal(monkeypatch):
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()
    match_id = created["matchId"]

    def reverse_shuffle(items):
        items.reverse()

    monkeypatch.setattr(app_module.random, "shuffle", reverse_shuffle)

    before_positions = {
        piece["id"]: (piece["row"], piece["col"])
        for piece in created["board"]
        if piece["owner"] == "player"
    }

    response = client.post(
        f"/api/match/{match_id}/shuffle/player",
        json={},
    )

    assert response.status_code == 200
    payload = response.json()
    after_positions = {
        piece["id"]: (piece["row"], piece["col"])
        for piece in payload["board"]
        if piece["owner"] == "player"
    }

    assert payload["phase"] == "reveal"
    assert payload["message"] == "Your squad positions were shuffled."
    assert set(after_positions.values()) == {
        (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
        (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7),
    }
    assert after_positions != before_positions


def test_player_can_choose_flag_during_reveal_and_shuffle_locks_afterward():
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()
    player_piece = next(piece for piece in created["board"] if piece["owner"] == "player" and piece["row"] == 2 and piece["col"] == 3)

    choose_response = client.post(
        f"/api/match/{created['matchId']}/flag/player",
        json={"pieceId": player_piece["id"]},
    )

    assert choose_response.status_code == 200
    choose_payload = choose_response.json()
    chosen_piece = next(piece for piece in choose_payload["board"] if piece["id"] == player_piece["id"])

    assert choose_payload["phase"] == "reveal"
    assert chosen_piece["role"] == "flag"
    assert "Flag placed" in choose_payload["message"]

    shuffle_response = client.post(
        f"/api/match/{created['matchId']}/shuffle/player",
        json={},
    )

    assert shuffle_response.status_code == 400
    assert "before choosing your flag" in shuffle_response.json()["detail"]

    reveal_response = client.post(
        f"/api/match/{created['matchId']}/reveal/complete",
        json={"confirmed": True},
    )

    assert reveal_response.status_code == 200
    reveal_payload = reveal_response.json()
    revealed_flag = next(piece for piece in reveal_payload["board"] if piece["id"] == player_piece["id"])

    assert revealed_flag["role"] == "flag"


def test_player_can_make_opening_move_into_neutral_zone():
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()
    choose_player_flag(created)
    revealed = client.post(
        f"/api/match/{created['matchId']}/reveal/complete",
        json={"confirmed": True},
    ).json()

    moving_piece = next(
        piece for piece in revealed["board"]
        if piece["owner"] == "player" and piece["row"] == 2 and piece["col"] == 1
    )

    response = client.post(
        f"/api/match/{created['matchId']}/turn/player-move",
        json={"pieceId": moving_piece["id"], "targetRow": 3, "targetCol": 1},
    )

    assert response.status_code == 200
    payload = response.json()
    moved_piece = next(piece for piece in payload["board"] if piece["id"] == moving_piece["id"])

    assert payload["phase"] == "ai_turn"
    assert payload["turnEndsAt"] is not None
    assert moved_piece["row"] == 3
    assert moved_piece["col"] == 1


def test_player_turn_timeout_finishes_match_as_loss():
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()
    choose_player_flag(created)
    revealed = client.post(
        f"/api/match/{created['matchId']}/reveal/complete",
        json={"confirmed": True},
    ).json()

    state = MATCHES[created["matchId"]]
    state["turn_ends_at"] = time.time() - 1

    response = client.post(f"/api/match/{revealed['matchId']}/turn/timeout")

    assert response.status_code == 200
    payload = response.json()
    assert payload["phase"] == "finished"
    assert payload["result"]["winner"] == "ai"
    assert "Time ran out on your turn" in payload["result"]["reason"]


def test_ai_turn_timeout_awards_player_win():
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()
    choose_player_flag(created)
    revealed = client.post(
        f"/api/match/{created['matchId']}/reveal/complete",
        json={"confirmed": True},
    ).json()

    moving_piece = next(
        piece for piece in revealed["board"]
        if piece["owner"] == "player" and piece["row"] == 2 and piece["col"] == 1
    )
    moved = client.post(
        f"/api/match/{created['matchId']}/turn/player-move",
        json={"pieceId": moving_piece["id"], "targetRow": 3, "targetCol": 1},
    ).json()

    state = MATCHES[created["matchId"]]
    state["turn_ends_at"] = time.time() - 1

    response = client.post(f"/api/match/{moved['matchId']}/turn/timeout")

    assert response.status_code == 200
    payload = response.json()
    assert payload["phase"] == "finished"
    assert payload["result"]["winner"] == "player"
    assert "AI ran out of time" in payload["result"]["reason"]


def test_ai_can_respond_after_player_opening_move():
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()
    choose_player_flag(created)
    revealed = client.post(
        f"/api/match/{created['matchId']}/reveal/complete",
        json={"confirmed": True},
    ).json()

    moving_piece = next(
        piece for piece in revealed["board"]
        if piece["owner"] == "player" and piece["row"] == 2 and piece["col"] == 1
    )

    player_response = client.post(
        f"/api/match/{created['matchId']}/turn/player-move",
        json={"pieceId": moving_piece["id"], "targetRow": 3, "targetCol": 1},
    )

    assert player_response.status_code == 200
    assert player_response.json()["phase"] == "ai_turn"

    ai_response = client.post(f"/api/match/{created['matchId']}/turn/ai-move")

    assert ai_response.status_code == 200
    payload = ai_response.json()

    assert payload["phase"] == "player_turn"
    assert payload["currentTurn"] == "player"
    assert any(
        piece["owner"] == "ai" and piece["alive"] and piece["row"] == 4
        for piece in payload["board"]
    )


def test_capturing_flag_ends_match_immediately():
    MATCHES.clear()
    created = client.post("/api/match/create", json={"difficulty": "easy"}).json()
    match_id = created["matchId"]
    state = MATCHES[match_id]

    attacker = state["pieces"][0]
    defender = state["pieces"][-1]

    for piece in state["pieces"]:
        piece["alive"] = False

    attacker["alive"] = True
    attacker["owner"] = "player"
    attacker["row"] = 2
    attacker["col"] = 1
    attacker["weapon"] = "paper"
    attacker["role"] = "soldier"

    defender["alive"] = True
    defender["owner"] = "ai"
    defender["row"] = 3
    defender["col"] = 1
    defender["weapon"] = "rock"
    defender["role"] = "flag"

    state["phase"] = "player_turn"
    state["current_turn"] = "player"
    state["last_duel"] = None
    state["pending_repick"] = None
    state["result"] = None
    state["message"] = "Your turn."

    response = client.post(
        f"/api/match/{match_id}/turn/player-move",
        json={"pieceId": attacker["id"], "targetRow": 3, "targetCol": 1},
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["phase"] == "finished"
    assert payload["result"]["winner"] == "player"
    assert "flag" in payload["result"]["reason"].lower()
