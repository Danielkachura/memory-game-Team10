# Memory Game - Team 10

Browser-based memory card game built for a hackathon with Claude-powered theme generation, hints, and end-game narration.

## Product Summary
- Core loop: flip cards, match pairs, finish the board
- Difficulties: `easy`, `medium`, `hard`
- Themes: `animals`, `flags`, `space`, `custom-ai`
- AI features: custom theme generation, cryptic hints, win-screen recap

## Current Repository State
This repository now contains the planning and operating artifacts needed to build the MVP:
- product requirements in [docs/PRD.md](docs/PRD.md)
- technical design in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- decision log in [docs/DECISIONS.md](docs/DECISIONS.md)
- sprint plan in [docs/sprints/sprint_01/](docs/sprints/sprint_01/)
- role model in [AGENTS.md](AGENTS.md) and `.claude/commands/`

The repository now contains a dedicated frontend workspace in `frontend/app/` plus the project module layout for gameplay, AI, UI, and backend proxy work.

## Team Structure
- `[FOUNDER]` sets scope and final decisions
- `[CTO]` owns architecture, quality bar, and release readiness
- `[Architect]` defines system structure and shared contracts
- `[Tech Lead:frontend]` owns UI architecture and state flows
- `[Tech Lead:backend]` owns Claude proxy, validation, and secrets
- `[QA Lead]` owns verification and release gates
- `[Security Reviewer]` checks trust boundaries and key exposure
- `[DEV:shared]`, `[DEV:frontend]`, `[DEV:backend]` implement the system

## Planned Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest
- Playwright
- Anthropic Claude API through a server-side proxy

## Required Environment
Create `.env` from `.env.example` and set:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

Do not expose the key in browser code or `VITE_` variables.

## Commands
Run the frontend workspace from the project root with:

```bash
npm --prefix frontend/app run dev
npm --prefix frontend/app run build
npm --prefix frontend/app run preview
npm --prefix frontend/app run test
npm --prefix frontend/app run lint
npx playwright test
```

## Definition of Done
A task is not done until:
- the app behavior matches the PRD
- unit tests cover the new logic
- Playwright covers affected UI flows
- regressions are checked
- the CTO or a teammate reviews the change
- screenshots exist for meaningful UI changes

## Build Order
1. Implement shared gameplay utilities and contracts
2. Implement game state and board UI
3. Add scoring, timer, and win screen
4. Add secure Claude proxy
5. Add AI theme generation, hinting, and recap
6. Expand unit, integration, and E2E coverage
