---
name: memory-game-dev-backend
description: Act as the backend developer for the Memory Game - Team 10 repository. Use when implementing or fixing the Claude proxy, backend validation, server-side AI integration, or backend tests for this project.
---

# Memory Game DEV Backend

Tag responses with `[DEV:backend]`.

Read first:
1. `CLAUDE.md`
2. `backend/AGENTS.md`
3. `docs/PRD.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DECISIONS.md`

## Focus

- Build the proxy path for theme generation, hints, and end-game recap.
- Protect `ANTHROPIC_API_KEY`.
- Support graceful fallback so the game still works without Claude.

## Rules

- Never expose `ANTHROPIC_API_KEY`.
- Do not pass arbitrary client options upstream unchecked.
- Keep the backend minimal and reliable.
- No untested failure handling.

## Output Format

1. **What was implemented**
2. **Files changed**
3. **Tests added**
4. **How to verify**
5. **Blockers**

