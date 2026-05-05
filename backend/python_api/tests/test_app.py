from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

import backend.python_api.app as battle_app


class PythonApiTests(unittest.TestCase):
    def setUp(self) -> None:
        battle_app.MATCHES.clear()
        self.client = TestClient(battle_app.app)

    @patch("backend.python_api.app.generate_squads")
    def test_creates_match_in_reveal_phase(self, mocked_generate) -> None:
        mocked_generate.return_value = battle_app.fallback_squads()
        response = self.client.post("/api/match/create", json={"difficulty": "medium"})
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["phase"], "reveal")
        self.assertEqual(len(payload["board"]), 20)

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

    def test_dead_enemy_piece_reveals_role_in_board_payload(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        ai_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece.update({"row": 4, "col": 1, "weapon": "rock"})
        ai_piece.update({"row": 5, "col": 1, "weapon": "scissors", "role": "flag"})

        response = self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": player_piece["id"], "targetId": ai_piece["id"]},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        defeated = next(piece for piece in payload["board"] if piece["id"] == ai_piece["id"])
        self.assertFalse(defeated["alive"])
        self.assertEqual(defeated["role"], "flag")
        self.assertEqual(defeated["roleIcon"], battle_app.ROLE_ICON["flag"])
        self.assertIsNone(defeated["weapon"])
        self.assertIsNone(defeated["weaponIcon"])

    def test_hidden_info_regression_for_roles_and_silhouettes(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        match_state = battle_app.MATCHES[match_id]

        ai_pieces = [piece for piece in match_state["pieces"] if piece["owner"] == "ai"]
        ai_pieces[0]["role"] = "flag"
        ai_pieces[1]["role"] = "decoy"

        active_payload = self.client.get(f"/api/match/{match_id}").json()
        alive_enemy_pieces = [piece for piece in active_payload["board"] if piece["owner"] == "ai" and piece["alive"]]
        self.assertTrue(alive_enemy_pieces)
        self.assertTrue(all(piece["weapon"] is None for piece in alive_enemy_pieces))
        self.assertTrue(all(piece["weaponIcon"] is None for piece in alive_enemy_pieces))
        self.assertTrue(all(piece["role"] is None for piece in alive_enemy_pieces))
        self.assertTrue(all(piece["roleIcon"] is None for piece in alive_enemy_pieces))
        self.assertTrue(all(piece["silhouette"] for piece in alive_enemy_pieces))

        ai_pieces[0]["alive"] = False
        defeated_payload = self.client.get(f"/api/match/{match_id}").json()
        defeated = next(piece for piece in defeated_payload["board"] if piece["id"] == ai_pieces[0]["id"])
        self.assertEqual(defeated["role"], "flag")
        self.assertEqual(defeated["roleIcon"], battle_app.ROLE_ICON["flag"])
        self.assertFalse(defeated["silhouette"])

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

    def test_lone_enemy_decoy_becomes_killable_after_stalemate(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        match_state = battle_app.MATCHES[match_id]
        match_state["phase"] = "player_turn"
        match_state["current_turn"] = "player"

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        decoy = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece.update({"row": 4, "col": 1, "weapon": "rock", "role": "soldier"})
        decoy.update({"row": 5, "col": 1, "weapon": "scissors", "role": "decoy", "alive": True})
        for piece in match_state["pieces"]:
            if piece["owner"] == "ai" and piece["id"] != decoy["id"]:
                piece["alive"] = False
                piece["role"] = "soldier"

        response = self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": player_piece["id"], "targetId": decoy["id"]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(match_state["decoy_stalemate"])
        self.assertFalse(decoy["alive"])
        self.assertTrue(any("Lone Decoy remaining" in entry["message"] for entry in match_state["event_log"]))

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

    def test_fifth_consecutive_tie_forces_resolution(self) -> None:
        create_payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = create_payload["matchId"]
        match_state = battle_app.MATCHES[match_id]
        match_state["phase"] = "player_turn"
        match_state["current_turn"] = "player"

        player_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "player")
        ai_piece = next(piece for piece in match_state["pieces"] if piece["owner"] == "ai")
        player_piece.update({"row": 4, "col": 1, "weapon": "rock", "role": "soldier"})
        ai_piece.update({"row": 5, "col": 1, "weapon": "rock", "role": "soldier"})

        tie_response = self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": player_piece["id"], "targetId": ai_piece["id"]},
        )
        self.assertEqual(tie_response.status_code, 200)
        self.assertEqual(tie_response.json()["phase"], "repick")

        with patch("backend.python_api.app.random.choice", side_effect=["rock", "rock", "rock", "rock", "attacker"]):
            for _ in range(4):
                response = self.client.post(
                    f"/api/match/{match_id}/turn/tie-repick",
                    json={"weapon": "rock"},
                )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertNotEqual(payload["phase"], "repick")
        self.assertIsNone(match_state["pending_repick"])
        self.assertEqual(payload["duel"]["winner"], "attacker")
        self.assertFalse(payload["duel"]["tie"])
        self.assertTrue(any("Forced resolution after 5 consecutive ties." in entry["message"] for entry in payload["eventLog"]))

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


if __name__ == "__main__":
    unittest.main()
