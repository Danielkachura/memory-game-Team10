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


if __name__ == "__main__":
    unittest.main()
