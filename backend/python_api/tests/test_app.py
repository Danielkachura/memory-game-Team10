from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.python_api.app import app


class PythonApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_rejects_invalid_feature(self) -> None:
        response = self.client.post("/api/claude", json={"feature": "bad", "prompt": "x"})
        self.assertEqual(response.status_code, 422)

    @patch("backend.python_api.app.call_anthropic", return_value="Proxy success")
    def test_normalizes_successful_response(self, mocked_call) -> None:
        response = self.client.post("/api/claude", json={"feature": "hint", "prompt": "go"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"text": "Proxy success"})
        mocked_call.assert_called_once_with("hint", "go")


if __name__ == "__main__":
    unittest.main()
