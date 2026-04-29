# Review Hotspots

## High-Risk Files

- `frontend/modules/game/src/hooks/useGame.ts`
- `frontend/modules/shared/src/constants/gameConfig.ts`
- `frontend/modules/shared/src/utils/scoreCalculator.ts`
- `frontend/modules/ai/src/services/claudeClient.ts`
- `backend/modules/claude_proxy/src/api/handleClaudeProxy.ts`
- `backend/modules/claude_proxy/src/services/anthropicService.ts`
- `backend/modules/claude_proxy/src/validators/request.ts`
- `tests/e2e/example.spec.ts`

## What to Look For

- stale duplicated rules instead of shared constants
- frontend code choosing model, tokens, or secret-bearing config
- missing fallback text on Claude errors
- timer or move counts drifting from real play
- tests that only cover the happy path for risky logic

