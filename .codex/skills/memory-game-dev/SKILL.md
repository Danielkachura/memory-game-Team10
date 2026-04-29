---
name: memory-game-dev
description: Develop, fix, or extend the Memory Game - Team 10 codebase. Use when working in this repository on frontend gameplay, shared game rules, backend Claude proxy integration, project commands, testing, or repo-specific implementation workflow. Also use when a request needs the repo's definition of done, module boundaries, or command conventions before making changes.
---

# Memory Game Dev

Read `AGENTS.md`, `CLAUDE.md`, and `docs/ARCHITECTURE.md` first.

Use this skill to work inside this repository with the project's actual workflow rather than generic app assumptions.

## Quick Workflow

1. Confirm the target area:
   - `frontend/app` for the Vite workspace
   - `frontend/modules/shared` for canonical types, constants, and reusable rules
   - `frontend/modules/game` for gameplay components, hooks, and utilities
   - `frontend/modules/ai` for prompt builders and frontend AI service wrappers
   - `backend/python_api` for server-side Claude calls and validation
2. Read the relevant reference file from `references/` before changing code.
3. Implement the smallest coherent change.
4. Run only the verification commands needed for the touched area.
5. Report what changed, what was verified, and any remaining risk.

## Repo Rules

- Keep `ANTHROPIC_API_KEY` server-side only.
- Do not add frontend `VITE_` variables for secrets.
- Do not move game rules out of `frontend/modules/shared` once they are canonical there.
- Do not call Claude on card flips.
- Do not mark work done without tests or a concrete reason tests could not run.
- Prefer editing TypeScript sources over generated `.js`, `.d.ts`, or `.tsbuildinfo` outputs unless the repo explicitly requires generated files to stay committed.

## Command Set

Run commands from the repo root:

```bash
npm --prefix frontend/app run dev
npm --prefix frontend/app run test
npm --prefix frontend/app run build
npm --prefix frontend/app run lint
npx playwright test
```

Use `npm --prefix frontend/app run test` after gameplay, shared-rule, or frontend AI changes.

Use `npx playwright test` after meaningful UI flow changes.

## Reference Files

- `references/project-map.md` for repo layout, ownership, and common tasks
- `references/game-rules.md` for canonical gameplay and scoring rules
- `references/qa-checklist.md` for required verification and regression focus
