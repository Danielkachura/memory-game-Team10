# claude_proxy Module

Server-side proxy boundary for Claude features in the Memory Game.

## Owns
- `/api/claude` request handling
- request validation
- token and model enforcement
- timeout handling
- normalized error responses for the frontend

## Planned Structure
- `src/api/` for route handlers
- `src/services/` for Anthropic request orchestration
- `src/validators/` for input validation
- `tests/unit/` for validation and service logic
- `tests/integration/` for proxy behavior
