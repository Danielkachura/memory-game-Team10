# Skills Matrix
# Memory Game - Team 10

This file defines the capabilities expected from each role so work can be assigned cleanly.

| Role | Core Skills | Owns | Outputs |
|---|---|---|---|
| `[CTO]` | architecture, prioritization, tradeoff analysis, code review | system direction, release bar | plans, reviews, decisions |
| `[Architect]` | interface design, dependency control, domain modeling | module boundaries, shared contracts | architecture updates, type ownership |
| `[UI/UX Lead]` | interaction design, readability, accessibility, motion restraint, visual hierarchy | board clarity, action affordances, demo polish | UX guidance, UI review notes, interaction acceptance details |
| `[Tech Lead:frontend]` | React architecture, state modeling, accessibility, responsive UI | game UI, hooks, interaction design | frontend task breakdown, review notes |
| `[Tech Lead:backend]` | API design, validation, secret handling, resilience | Claude proxy, request/response contracts | backend task breakdown, security-aware review |
| `[QA Lead]` | test strategy, exploratory testing, regression design | release checklist, automated coverage targets | bug reports, risk sign-off |
| `[Security Reviewer]` | threat modeling, env handling, exposure checks | API key rules, trust boundaries | security findings, deployment checks |
| `[DEV:shared]` | TypeScript utilities, contracts, repo wiring | shared types, constants, toolchain config | infra and shared code |
| `[DEV:frontend]` | React components, hooks, tests, styling | game logic and UI | app code and UI tests |
| `[DEV:backend]` | server routes, API clients, validators, tests | Claude proxy implementation | proxy code and backend tests |

## Assignment Rules

- If a task crosses module boundaries, `[Architect]` must define the contract first.
- If a task changes how players perceive actions or state, `[UI/UX Lead]` defines the expected interaction behavior.
- If a task affects user interaction, `[Tech Lead:frontend]` owns acceptance details.
- If a task touches Claude requests or env vars, `[Tech Lead:backend]` and `[Security Reviewer]` both review it.
- No feature is complete without `[QA Lead]` defining verification criteria.
