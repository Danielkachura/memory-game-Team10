from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

import backend.python_api.app as battle_app


class PythonApiTests(unittest.TestCase):
    def setUp(self) -> None:
        battle_app.MATCHES.clear()
        battle_app.TOKENS.clear()
        battle_app.LOBBIES.clear()
        self.client = TestClient(battle_app.app)

    @patch("backend.python_api.app.generate_squads")
    def test_creates_match_in_reveal_phase(self, mocked_generate) -> None:
        mocked_generate.return_value = battle_app.fallback_squads()
        response = self.client.post("/api/match/create", json={"difficulty": "medium"})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["phase"], "reveal")
        self.assertEqual(len(payload["board"]), 20)

    @patch("backend.python_api.app.generate_squads")
    def test_reveal_completion_hides_enemy_state(self, mocked_generate) -> None:
        mocked_generate.return_value = battle_app.fallback_squads()
        create_payload = self.client.post("/api/match/create", json={"difficulty": "easy"}).json()
        response = self.client.post(
            f"/api/match/{create_payload['matchId']}/reveal/complete",
            json={"confirmed": True},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["phase"], "player_turn")
        enemy_pieces = [piece for piece in payload["board"] if piece["owner"] == "ai" and piece["alive"]]
        self.assertTrue(all(piece["weapon"] is None for piece in enemy_pieces))

    def test_dead_enemy_role_stays_hidden_until_match_ends(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        ai_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece["role"] = "flag"
        player_piece["alive"] = False
        ai_piece["role"] = "decoy"
        ai_piece["alive"] = False

        active_payload = self.client.get(f"/api/match/{match_id}").json()
        own_dead_piece = next(piece for piece in active_payload["board"] if piece["id"] == player_piece["id"])
        enemy_dead_piece = next(piece for piece in active_payload["board"] if piece["id"] == ai_piece["id"])
        self.assertEqual(own_dead_piece["role"], "flag")
        self.assertIsNone(enemy_dead_piece["role"])
        self.assertEqual(enemy_dead_piece["label"], "Defeated unit")

        battle_app.end_match(match_state, "player", "Enemy flag captured.")
        finished_payload = self.client.get(f"/api/match/{match_id}").json()
        revealed_enemy_piece = next(piece for piece in finished_payload["board"] if piece["id"] == ai_piece["id"])
        self.assertEqual(revealed_enemy_piece["role"], "decoy")

    def test_own_dead_piece_shows_role(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        player_piece["role"] = "flag"
        player_piece["weapon"] = "rock"
        player_piece["alive"] = False

        payload = self.client.get(f"/api/match/{match_id}").json()
        own_dead_piece = next(piece for piece in payload["board"] if piece["id"] == player_piece["id"])

        self.assertEqual(own_dead_piece["role"], "flag")
        self.assertEqual(own_dead_piece["roleIcon"], battle_app.ROLE_ICON["flag"])
        self.assertIn("flag", own_dead_piece["label"])

    def test_enemy_weapon_hidden_after_duel(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        ai_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece["row"] = 4
        player_piece["col"] = 1
        ai_piece["row"] = 5
        ai_piece["col"] = 1
        player_piece["weapon"] = "rock"
        ai_piece["weapon"] = "paper"

        response = self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": player_piece["id"], "targetId": ai_piece["id"]},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        surviving_enemy = next(piece for piece in payload["board"] if piece["id"] == ai_piece["id"])
        self.assertEqual(payload["duel"]["defenderWeapon"], "paper")
        self.assertIsNone(surviving_enemy["weapon"])
        self.assertEqual(surviving_enemy["label"], "Hidden Operative")

    def test_pvp_invalid_token_rejected(self) -> None:
        lobby_response = self.client.post(
            "/api/lobby/create",
            json={"displayName": "Host", "difficulty": "medium"},
        )
        self.assertEqual(lobby_response.status_code, 200)
        lobby_payload = lobby_response.json()

        join_response = self.client.post(
            f"/api/lobby/{lobby_payload['lobbyId']}/join",
            json={"displayName": "Guest"},
        )
        self.assertEqual(join_response.status_code, 200)
        match_id = join_response.json()["matchId"]

        response = self.client.get(
            f"/api/match/{match_id}",
            headers={"X-Player-Token": "fake-token-12345"},
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Invalid player token.")

    def test_cors_rejects_unconfigured_origin(self) -> None:
        response = self.client.options(
            "/api/match/create",
            headers={
                "Origin": "https://evil.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertNotEqual(response.headers.get("access-control-allow-origin"), "https://evil.example")

    def test_player_attack_returns_duel_summary(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        ai_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece["row"] = 4
        player_piece["col"] = 1
        ai_piece["row"] = 5
        ai_piece["col"] = 1
        player_piece["weapon"] = "rock"
        ai_piece["weapon"] = "scissors"

        response = self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": player_piece["id"], "targetId": ai_piece["id"]},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["duel"]["winner"], "attacker")
        self.assertTrue(any("Attack declared:" in entry["message"] for entry in payload["eventLog"]))

    def test_player_cannot_attack_with_ai_piece(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        ai_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        ai_piece["row"] = 4
        ai_piece["col"] = 1
        player_piece["row"] = 3
        player_piece["col"] = 1

        response = self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": ai_piece["id"], "targetId": player_piece["id"]},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Cannot attack with AI pieces.", response.text)
        self.assertFalse(any("Attack declared:" in entry["message"] for entry in match_state["event_log"]))

    def test_rock_loses_to_paper(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        ai_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece["row"] = 4
        player_piece["col"] = 1
        ai_piece["row"] = 5
        ai_piece["col"] = 1
        player_piece["weapon"] = "rock"
        ai_piece["weapon"] = "paper"

        response = self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": player_piece["id"], "targetId": ai_piece["id"]},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["duel"]["winner"], "defender")
        self.assertFalse(next(piece for piece in match_state["pieces"] if piece["id"] == player_piece["id"])["alive"])
        self.assertTrue(next(piece for piece in match_state["pieces"] if piece["id"] == ai_piece["id"])["alive"])

    def test_player_move_advances_piece(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]
        player_piece = next(
            piece for piece in match_state["pieces"] if piece["owner"] == "player" and piece["row"] == 2
        )

        response = self.client.post(
            f"/api/match/{match_id}/turn/player-move",
            json={"pieceId": player_piece["id"], "row": 3, "col": 1},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        moved_piece = next(piece for piece in payload["board"] if piece["id"] == player_piece["id"])
        self.assertEqual((moved_piece["row"], moved_piece["col"]), (3, 1))
        self.assertTrue(any("Move:" in entry["message"] for entry in payload["eventLog"]))

    def test_player_move_into_enemy_square_is_rejected(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        ai_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece["row"] = 3
        player_piece["col"] = 3
        ai_piece["row"] = 4
        ai_piece["col"] = 3
        response = self.client.post(
            f"/api/match/{match_id}/turn/player-move",
            json={"pieceId": player_piece["id"], "targetRow": 4, "targetCol": 3},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("occupied", response.text.lower())

    def test_position_index_ignores_dead_pieces(self) -> None:
        match_state = {
            "pieces": [
                {"id": "dead", "row": 3, "col": 2, "alive": False},
                {"id": "alive", "row": 3, "col": 2, "alive": True},
            ],
        }

        index = battle_app.build_position_index(match_state)

        self.assertIs(battle_app.piece_at_fast(index, 3, 2), match_state["pieces"][1])
        self.assertIsNone(battle_app.piece_at_fast(index, 4, 2))

    def test_tie_repick_does_not_change_canonical_weapons(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        ai_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece["row"] = 4
        player_piece["col"] = 1
        ai_piece["row"] = 5
        ai_piece["col"] = 1
        player_piece["weapon"] = "rock"
        ai_piece["weapon"] = "rock"

        tie_response = self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": player_piece["id"], "targetId": ai_piece["id"]},
        )
        self.assertEqual(tie_response.status_code, 200)
        self.assertEqual(tie_response.json()["phase"], "repick")

        with patch("backend.python_api.app.random.choice", return_value="scissors"):
            repick_response = self.client.post(
                f"/api/match/{match_id}/turn/tie-repick",
                json={"weapon": "paper"},
            )

        self.assertEqual(repick_response.status_code, 200)
        self.assertEqual(player_piece["weapon"], "rock")
        self.assertEqual(ai_piece["weapon"], "rock")
        payload = repick_response.json()
        self.assertEqual(payload["duel"]["attackerWeapon"], "paper")
        self.assertEqual(payload["duel"]["defenderWeapon"], "scissors")

    def test_ai_without_legal_move_ends_match_instead_of_attacking_illegally(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        match_state["phase"] = "ai_turn"
        match_state["current_turn"] = "ai"

        with patch("backend.python_api.app.choose_ai_move_with_claude", side_effect=ValueError("illegal ai output")):
            with patch("backend.python_api.app.choose_ai_move", side_effect=ValueError("no legal fallback")):
                response = self.client.post(f"/api/match/{match_id}/turn/ai-move")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["phase"], "finished")
        self.assertEqual(payload["result"]["winner"], "player")
        self.assertIn("no legal move", payload["result"]["reason"].lower())
        messages = [entry["message"] for entry in payload["eventLog"]]
        self.assertTrue(any("Claude AI failed: illegal ai output" in message for message in messages))
        self.assertTrue(any("Fallback AI failed: no legal fallback" in message for message in messages))


if __name__ == "__main__":
    unittest.main()
