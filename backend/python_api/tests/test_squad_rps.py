from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

import backend.python_api.app as battle_app
from backend.python_api.app import (
    alive_pieces,
    check_decoy_stalemate,
    duel_result,
    fallback_squads,
)


class RpsResolutionTests(unittest.TestCase):
    """duel_result covers all 9 weapon combinations."""

    def test_rock_beats_scissors(self) -> None:
        self.assertEqual(duel_result({}, {}, "rock", "scissors"), "attacker")

    def test_scissors_beats_paper(self) -> None:
        self.assertEqual(duel_result({}, {}, "scissors", "paper"), "attacker")

    def test_paper_beats_rock(self) -> None:
        self.assertEqual(duel_result({}, {}, "paper", "rock"), "attacker")

    def test_rock_loses_to_paper(self) -> None:
        self.assertEqual(duel_result({}, {}, "rock", "paper"), "defender")

    def test_paper_loses_to_scissors(self) -> None:
        self.assertEqual(duel_result({}, {}, "paper", "scissors"), "defender")

    def test_scissors_loses_to_rock(self) -> None:
        self.assertEqual(duel_result({}, {}, "scissors", "rock"), "defender")

    def test_rock_tie(self) -> None:
        self.assertEqual(duel_result({}, {}, "rock", "rock"), "tie")

    def test_paper_tie(self) -> None:
        self.assertEqual(duel_result({}, {}, "paper", "paper"), "tie")

    def test_scissors_tie(self) -> None:
        self.assertEqual(duel_result({}, {}, "scissors", "scissors"), "tie")


class DecoyStalemate(unittest.TestCase):
    def _make_state(self, ai_roles: list[str]) -> dict:
        pieces = []
        for i, role in enumerate(ai_roles):
            pieces.append({"id": f"ai-{i}", "owner": "ai", "alive": True, "role": role, "weapon": "rock", "name": f"Unit{i}"})
        pieces.append({"id": "player-0", "owner": "player", "alive": True, "role": "flag", "weapon": "rock", "name": "P0"})
        return {"pieces": pieces, "phase": "player_turn", "message": ""}

    def test_decoy_stalemate_triggers_when_only_decoy_alive(self) -> None:
        state = self._make_state(["decoy"])
        check_decoy_stalemate(state)
        ai = alive_pieces(state, "ai")
        self.assertEqual(ai[0]["role"], "soldier")

    def test_stalemate_does_not_trigger_with_other_ai_units(self) -> None:
        state = self._make_state(["decoy", "soldier"])
        check_decoy_stalemate(state)
        decoy = next(p for p in state["pieces"] if p["id"] == "ai-0")
        self.assertEqual(decoy["role"], "decoy")

    def test_stalemate_does_not_trigger_when_game_finished(self) -> None:
        state = self._make_state(["decoy"])
        state["phase"] = "finished"
        check_decoy_stalemate(state)
        decoy = next(p for p in state["pieces"] if p["id"] == "ai-0")
        self.assertEqual(decoy["role"], "decoy")


class TieRepickTests(unittest.TestCase):
    def setUp(self) -> None:
        battle_app.MATCHES.clear()
        self.client = TestClient(battle_app.app)

    @patch("backend.python_api.app.generate_squads")
    def _start_player_turn(self, mocked_generate) -> tuple[str, dict, dict]:
        mocked_generate.return_value = fallback_squads()
        payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        state = battle_app.MATCHES[match_id]
        player_piece = next(p for p in state["pieces"] if p["owner"] == "player")
        ai_piece = next(p for p in state["pieces"] if p["owner"] == "ai")
        return match_id, player_piece, ai_piece

    def test_tie_triggers_repick_phase(self) -> None:
        match_id, player_piece, ai_piece = self._start_player_turn()
        player_piece["weapon"] = "rock"
        ai_piece["weapon"] = "rock"
        response = self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": player_piece["id"], "targetId": ai_piece["id"]},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["phase"], "repick")

    def test_repick_resolves_duel(self) -> None:
        match_id, player_piece, ai_piece = self._start_player_turn()
        player_piece["weapon"] = "rock"
        ai_piece["weapon"] = "rock"
        self.client.post(
            f"/api/match/{match_id}/turn/player-attack",
            json={"attackerId": player_piece["id"], "targetId": ai_piece["id"]},
        )
        with patch("backend.python_api.app.random.choice", return_value="scissors"):
            response = self.client.post(
                f"/api/match/{match_id}/turn/tie-repick",
                json={"weapon": "rock"},
            )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertNotEqual(result["phase"], "repick")
        self.assertEqual(result["duel"]["tie"], False)

    def test_repick_fails_when_no_tie_pending(self) -> None:
        match_id, _, _ = self._start_player_turn()
        response = self.client.post(
            f"/api/match/{match_id}/turn/tie-repick",
            json={"weapon": "rock"},
        )
        self.assertEqual(response.status_code, 400)


class AiMoveTests(unittest.TestCase):
    def setUp(self) -> None:
        battle_app.MATCHES.clear()
        self.client = TestClient(battle_app.app)

    @patch("backend.python_api.app.generate_squads")
    def _start_ai_turn(self, mocked_generate) -> tuple[str, dict, dict]:
        mocked_generate.return_value = fallback_squads()
        payload = self.client.post("/api/match/create", json={"difficulty": "easy"}).json()
        match_id = payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        state = battle_app.MATCHES[match_id]
        state["phase"] = "ai_turn"
        state["current_turn"] = "ai"
        return match_id, state

    def test_ai_move_uses_fallback_when_claude_fails(self) -> None:
        match_id, _ = self._start_ai_turn()
        with patch("backend.python_api.app.choose_ai_move_with_claude", side_effect=Exception("timeout")):
            response = self.client.post(f"/api/match/{match_id}/turn/ai-move")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn(payload["phase"], ("player_turn", "repick", "finished"))

    def test_ai_move_fails_when_not_ai_turn(self) -> None:
        battle_app.MATCHES.clear()
        with patch("backend.python_api.app.generate_squads", return_value=fallback_squads()):
            payload = self.client.post("/api/match/create", json={"difficulty": "easy"}).json()
        match_id = payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        response = self.client.post(f"/api/match/{match_id}/turn/ai-move")
        self.assertEqual(response.status_code, 400)


class HiddenInfoTests(unittest.TestCase):
    def setUp(self) -> None:
        battle_app.MATCHES.clear()
        self.client = TestClient(battle_app.app)

    @patch("backend.python_api.app.generate_squads")
    def test_enemy_weapons_null_after_reveal(self, mocked_generate) -> None:
        mocked_generate.return_value = fallback_squads()
        payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = payload["matchId"]
        response = self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        board = response.json()["board"]
        enemy_alive = [p for p in board if p["owner"] == "ai" and p["alive"]]
        self.assertTrue(all(p["weapon"] is None for p in enemy_alive), "Enemy weapons must be null after reveal")

    @patch("backend.python_api.app.generate_squads")
    def test_enemy_roles_null_after_reveal(self, mocked_generate) -> None:
        mocked_generate.return_value = fallback_squads()
        payload = self.client.post("/api/match/create", json={"difficulty": "medium"}).json()
        match_id = payload["matchId"]
        response = self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        board = response.json()["board"]
        enemy_alive = [p for p in board if p["owner"] == "ai" and p["alive"]]
        self.assertTrue(all(p["role"] is None for p in enemy_alive), "Enemy roles must be null after reveal")

    @patch("backend.python_api.app.generate_squads")
    def test_full_reveal_on_game_over(self, mocked_generate) -> None:
        mocked_generate.return_value = fallback_squads()
        payload = self.client.post("/api/match/create", json={"difficulty": "easy"}).json()
        match_id = payload["matchId"]
        self.client.post(f"/api/match/{match_id}/reveal/complete", json={"confirmed": True})
        state = battle_app.MATCHES[match_id]
        player_flag = next(p for p in state["pieces"] if p["owner"] == "player" and p["role"] == "flag")
        ai_attacker = next(p for p in state["pieces"] if p["owner"] == "ai")
        player_flag["weapon"] = "scissors"
        ai_attacker["weapon"] = "rock"
        state["phase"] = "ai_turn"
        state["current_turn"] = "ai"
        with patch("backend.python_api.app.choose_ai_move_with_claude", side_effect=Exception):
            with patch("backend.python_api.app.choose_ai_move", return_value=(ai_attacker, player_flag, "test")):
                response = self.client.post(f"/api/match/{match_id}/turn/ai-move")
        payload = response.json()
        self.assertEqual(payload["phase"], "finished")
        ai_pieces_on_board = [p for p in payload["board"] if p["owner"] == "ai"]
        revealed = [p for p in ai_pieces_on_board if p["weapon"] is not None]
        self.assertGreater(len(revealed), 0, "AI weapons must be revealed on game over")


if __name__ == "__main__":
    unittest.main()
