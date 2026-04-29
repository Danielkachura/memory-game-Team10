# Sprint 01 - Foundation and MVP Delivery

| Field | Value |
|---|---|
| Sprint | 01 |
| Goal | Ship a playable memory game MVP with secure Claude integration and demo-ready tests |
| Status | Planned |
| Start | 2026-04-28 |
| End | Hackathon end date |
| CTO Owner | `[CTO]` |

---

## Sprint Objectives

1. Scaffold the actual app and toolchain
2. Build the core game loop and win condition
3. Add scoring, timer, difficulty, and theme selection
4. Add secure Claude-backed theme, hint, and recap flows
5. Add enough automated coverage for confident demo use

---

## Owner Map

| Area | Role Owner |
|---|---|
| System structure and interfaces | `[Architect]` |
| UI/gameplay implementation plan | `[Tech Lead:frontend]` |
| Proxy/API implementation plan | `[Tech Lead:backend]` |
| Quality gates and release sign-off | `[QA Lead]` |
| Secret handling and exposure review | `[Security Reviewer]` |

---

## Scope

In scope:
- Vite app scaffold and project scripts
- shared domain types and constants
- game board, cards, flip logic, timer, score, win screen
- difficulty and theme setup flow
- Claude proxy and frontend service wrappers
- AI theme generation, hinting, and end-game narration
- unit tests, integration tests, Playwright core flow

Out of scope:
- accounts
- persistence
- leaderboards
- multiplayer
- mobile app packaging

---

## Exit Criteria

- a full easy game can be played start to finish
- at least one Claude feature works live
- all Claude features fail gracefully
- unit tests cover core game logic
- Playwright covers the main user flow
- no browser-exposed API key

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| App scaffold not created early enough | High | High | build setup first before feature work |
| Claude API instability during demo | Medium | High | fallbacks, timeout, session caching |
| Port/config drift between docs and tests | Medium | Medium | standardize on `5173` and auto-start E2E server |
| Overbuilding beyond MVP | High | High | use PRD priorities and stop at demo-ready scope |

---

## Deliverables

- coherent project docs
- app scaffold plan and ownership model
- sprint task list with acceptance criteria
- sprint report and review templates
- implementation-ready architecture
