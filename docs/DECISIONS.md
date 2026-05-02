# Decision Log
# Squad RPS - Team 10

Every non-obvious technical or product-facing implementation choice should be recorded here.

---

## Decision: React + Vite over Next.js

**Date:** 2026-04-28  
**Status:** Accepted  
**Decided by:** Team 10

**Context:**  
The app is a browser-first interactive game with no SSR requirement.

**Options Considered:**  
1. Next.js  
2. React + Vite  
3. Plain HTML/CSS/JS

**Decision:**  
React + Vite

**Rationale:**  
Fast iteration, low setup overhead, and straightforward TypeScript support fit the hackathon build best.

---

## Decision: Backend-authoritative gameplay state

**Date:** 2026-04-29  
**Status:** Accepted  
**Decided by:** Team 10

**Context:**  
Squad RPS includes hidden weapons, hidden roles, viewer-specific state, AI turns, and duel resolution. Client-side canonical state would make hidden-info leaks and rules drift too likely.

**Options Considered:**  
1. Client-owned gameplay with a backend AI proxy  
2. Backend-authoritative match state with a rendering client  
3. Pure frontend gameplay with browser-exposed AI calls

**Decision:**  
The Python backend owns authoritative gameplay state and the frontend renders backend-returned match views.

**Rationale:**  
This is the only clean way to enforce hidden information, validate movement and attacks, and keep AI-visible state legal.

---

## Decision: Python + FastAPI backend

**Date:** 2026-04-29  
**Status:** Accepted  
**Decided by:** Team 10

**Context:**  
The product pivot replaced the original lightweight proxy requirement with a real match service.

**Options Considered:**  
1. Keep a frontend-only game with minimal proxy  
2. Node/Express match backend  
3. Python + FastAPI match backend

**Decision:**  
Use Python + FastAPI in `backend/python_api/`.

**Rationale:**  
FastAPI keeps the backend small while still supporting validation, authoritative rules, and AI integration cleanly.

---

## Decision: Movement remains in the current MVP branch

**Date:** 2026-04-29  
**Status:** Accepted for current branch  
**Decided by:** `[CTO]`

**Context:**  
The PRD contains an earlier recommendation to avoid movement for MVP, but the live app already implements adjacency-based movement and adjacent duels.

**Options Considered:**  
1. Remove movement and revert to direct attacks only  
2. Keep movement and stabilize it for demo use

**Decision:**  
Keep movement in the current branch and prioritize correctness and readability.

**Rationale:**  
Removing movement now would create churn and destabilize the demo branch more than stabilizing the current rule set.

---

## Decision: Tie repicks must not mutate canonical weapons

**Date:** 2026-04-29  
**Status:** Accepted  
**Decided by:** `[Tech Lead:backend]`

**Context:**  
Repick weapons are duel-local choices. Persisting them onto pieces changes future combat incorrectly and causes apparent rule violations.

**Options Considered:**  
1. Persist repick weapons onto pieces  
2. Treat repick weapons as temporary duel-only values

**Decision:**  
Repick weapons are temporary and must not mutate a piece’s canonical weapon.

**Rationale:**  
This preserves the intended hidden-information model and prevents later duels from resolving against the wrong stored weapon.

---

## Decision: Dead pieces do not occupy rendered board cells

**Date:** 2026-04-29  
**Status:** Accepted  
**Decided by:** `[Tech Lead:frontend]`

**Context:**  
Dead pieces may remain in payload history, but allowing them into the visible cell map can visually overwrite living pieces at the same coordinates.

**Options Considered:**  
1. Render all returned pieces into the board map  
2. Render only alive pieces into occupied board cells

**Decision:**  
Only alive pieces occupy client-rendered board cells.

**Rationale:**  
This prevents the visual “piece switching” bug and matches actual gameplay state.

---

## Decision: Event log is a release tool, not optional debug garnish

**Date:** 2026-04-29  
**Status:** Accepted  
**Decided by:** `[CTO]`, `[QA Lead]`

**Context:**  
The match has enough state transitions that live demo debugging becomes slow without engine-visible trace output.

**Options Considered:**  
1. Rely on console logging only  
2. Expose backend-authored event log in the match view  
3. No trace output in the UI

**Decision:**  
Expose a bounded backend-authored event log in the match payload and show it in the UI.

**Rationale:**  
This lets the team debug moves, attacks, ties, eliminations, and turn handoffs against the actual engine sequence.

---

## Decision: Vitest + Testing Library + Playwright

**Date:** 2026-04-28  
**Status:** Accepted  
**Decided by:** Team 10

**Context:**  
The project needs fast feedback and browser-level verification.

**Options Considered:**  
1. Jest + Cypress  
2. Vitest + Testing Library + Playwright  
3. Manual testing only

**Decision:**  
Vitest + Testing Library + Playwright

**Rationale:**  
Vitest fits Vite well, Testing Library covers component behavior, and Playwright covers browser verification.

---

## Decision: CTO-led role hierarchy for execution

**Date:** 2026-04-28  
**Status:** Accepted  
**Decided by:** `[CTO]`

**Context:**  
The project needs explicit ownership to avoid fuzzy responsibility during a hackathon build.

**Options Considered:**  
1. Keep only three broad roles  
2. Add specialized technical roles under the CTO  
3. Organize only by frontend/backend without architecture and QA leadership

**Decision:**  
Use `[Architect]`, `[UI/UX Lead]`, `[Tech Lead:frontend]`, `[Tech Lead:backend]`, `[QA Lead]`, and `[Security Reviewer]` under the CTO, with specialized DEV roles for implementation.

**Rationale:**  
This gives each critical system and review area a clear owner while preserving founder authority.

---

## Decision: Graceful AI fallback is required

**Date:** 2026-04-29  
**Status:** Accepted  
**Decided by:** `[QA Lead]` and `[Security Reviewer]`

**Context:**  
Claude-backed squad generation and AI turns are part of the product, but the match must remain playable when the API is slow, invalid, or unavailable.

**Options Considered:**  
1. Fail hard and block the match  
2. Fallback to backend-generated legal behavior  
3. Remove Claude involvement from the MVP

**Decision:**  
All AI-dependent paths must fail safely to a legal backend fallback.

**Rationale:**  
This protects demo reliability without relaxing the hidden-state or legality rules.

---

## Open Decisions

These are not yet fully settled and should be resolved explicitly:

1. **Decoy stalemate policy**
   Current question: what happens if only an invulnerable decoy remains?

2. **Tie loop cap**
   Current question: should repeated ties remain theoretically unbounded or be capped?

3. **Reveal duration tuning**
   Current question: keep 10 seconds or extend after playtesting?

---

## Decision: `origin/Nati-Features` is the presentation baseline for the integrated app

**Date:** 2026-05-02  
**Status:** Accepted  
**Decided by:** `[CTO]`

**Context:**  
The current integration branch already contains the valuable systems work that Nati's branch does not: backend-authoritative match flow, PVP lobby/match support, Vercel to Railway deployment wiring, and the current VS AI runtime path. But it also replaced Nati's art-driven board presentation, duel overlay, referee presentation, audio flow, and public assets with a more utilitarian shell.

**Options Considered:**  
1. Keep the current integration branch UI as the main baseline and selectively copy small art pieces from Nati  
2. Reset to `origin/Nati-Features` and re-port all gameplay and deployment systems onto it  
3. Treat `origin/Nati-Features` as the presentation baseline while preserving the current integration branch for game rules, PVP/VS AI flow, and deployment wiring

**Decision:**  
Use `origin/Nati-Features` as the UI/UX and asset baseline. Preserve the current integration branch for:
- backend-authoritative gameplay and tests
- PVP lobby plus attached-match flow
- VS AI flow
- Vercel and Railway deployment logic
- current API-base wiring and backend fixes

**Rationale:**  
This keeps the strongest visual shell already built by Nati while avoiding a risky rollback of working gameplay and deployment systems. The integration work should restore presentation files onto the current architecture, not reintroduce old client-owned rules or remove the deployment fixes.
