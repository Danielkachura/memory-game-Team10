# Decision Log
# Memory Game - Team 10

Every non-obvious technical choice should be recorded here.

---

## Decision: React + Vite over Next.js

**Date:** 2026-04-28  
**Status:** Accepted  
**Decided by:** Team 10

**Context:**  
The game is a browser-first interactive experience with no SSR requirement.

**Options Considered:**  
1. Next.js  
2. React + Vite  
3. Plain HTML/CSS/JS

**Decision:**  
React + Vite

**Rationale:**  
Fast local iteration, low setup overhead, and strong TypeScript support fit the hackathon MVP best.

---

## Decision: Client-side game state with server-side Claude proxy

**Date:** 2026-04-28  
**Status:** Accepted  
**Decided by:** Team 10

**Context:**  
The game rules are local UI logic, but Claude features require secure API key handling.

**Options Considered:**  
1. Full backend for all game state and AI calls  
2. Client-side game state with server-side AI proxy  
3. Pure frontend with browser-exposed API key

**Decision:**  
Keep gameplay state in the frontend and send Claude requests through a secure server-side proxy.

**Rationale:**  
This keeps the architecture small while preserving the security requirement that the key never reaches the browser.

---

## Decision: Vitest + Testing Library + Playwright

**Date:** 2026-04-28  
**Status:** Accepted  
**Decided by:** Team 10

**Context:**  
The team needs fast feedback on logic and reliable browser-level verification.

**Options Considered:**  
1. Jest + Cypress  
2. Vitest + Testing Library + Playwright  
3. Manual testing only

**Decision:**  
Vitest + Testing Library + Playwright

**Rationale:**  
Vitest integrates cleanly with Vite, Testing Library fits component behavior testing, and Playwright covers end-to-end flow and screenshots.

---

## Decision: CTO-led role hierarchy for execution

**Date:** 2026-04-28  
**Status:** Accepted  
**Decided by:** `[CTO]`

**Context:**  
The original scaffold defined only `[CTO]`, `[DEV]`, and `[QA]`. This project needs more explicit ownership to avoid fuzzy responsibility during a hackathon build.

**Options Considered:**  
1. Keep only three broad roles  
2. Add specialized technical roles under the CTO  
3. Organize only by frontend/backend without architecture and QA leadership

**Decision:**  
Use `[Architect]`, `[Tech Lead:frontend]`, `[Tech Lead:backend]`, `[QA Lead]`, and `[Security Reviewer]` under the CTO, with `[DEV:shared]`, `[DEV:frontend]`, and `[DEV:backend]` as implementation roles.

**Rationale:**  
This gives each critical area a clear owner while keeping the founder’s final authority unchanged.

---

## Decision: Shared-types-first module boundaries

**Date:** 2026-04-28  
**Status:** Accepted  
**Decided by:** `[Architect]`

**Context:**  
The game, AI, and proxy modules all depend on the same domain concepts and score rules.

**Options Considered:**  
1. Let each module define its own local types  
2. Centralize canonical shared types and constants  
3. Use runtime schemas only and infer all TS types

**Decision:**  
Create a shared frontend module for canonical types and constants, and keep proxy request validation separate on the backend.

**Rationale:**  
The game benefits from a single source of truth for core state while still allowing backend validation to remain explicit and security-focused.

---

## Decision: Graceful AI degradation is a release gate

**Date:** 2026-04-28  
**Status:** Accepted  
**Decided by:** `[QA Lead]` and `[Security Reviewer]`

**Context:**  
Claude features are part of the demo, but the game must remain functional if the API is unavailable, slow, or rate-limited.

**Options Considered:**  
1. Fail the feature visibly and block gameplay  
2. Use fallback content and continue play  
3. Remove AI features from the MVP

**Decision:**  
All AI features must have fallback behavior within 8 seconds.

**Rationale:**  
This protects the demo and aligns with the PRD requirement that the game still plays without AI.
