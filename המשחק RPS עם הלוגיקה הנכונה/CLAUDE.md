# Memory Game - Team 10 | Claude Code Project Context

> **Stack:** React + TypeScript + Vite + Tailwind CSS + Python FastAPI + Anthropic Claude API
> **Purpose:** A browser-based memory card-matching game with AI-powered themes, hints, and end-game narration.
>
> This file is auto-loaded by Claude Code CLI when you open this project directory.
> It is the single source of truth for Claude's project awareness.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Name** | Memory Game - Team 10 |
| **Purpose** | Fun, replayable card-matching game with Claude API integration |
| **Current sprint** | Sprint 01 |
| **Dev port** | 5173 |

---

## 2. What We Are Building

A **memory card-matching game** where players flip cards to find matching pairs.  
Runs primarily in the browser and integrates the Anthropic Claude API for intelligent features.

### Core Game Loop
1. Player sees a grid of face-down cards.
2. Player clicks a card to flip it face-up.
3. Player clicks a second card. If they match, both stay face-up. If not, both flip back after about 1 second.
4. No third card can be flipped while two unmatched cards are showing.
5. Game ends when all pairs are matched.
6. Win screen shows moves, elapsed time, and star rating.

### Claude API Integration Points
| Feature | When triggered | What Claude does |
|---|---|---|
| **Theme Generator** | New game with `custom-ai` theme | Generates unique card content strings |
| **Hint System** | Player clicks `Hint` | Returns a cryptic clue without revealing card positions |
| **End-Game Narrator** | All pairs matched | Writes a 2-sentence recap matching the player's score |

---

## 3. Key Commands

```bash
# Frontend development
npm --prefix frontend/app run dev      # Start Vite dev server on port 5173
npm --prefix frontend/app run build    # Production build
npm --prefix frontend/app run preview  # Preview production build locally
npm --prefix frontend/app run test     # Run Vitest unit tests
npm --prefix frontend/app run lint     # TypeScript check

# Backend development
python -m uvicorn backend.python_api.app:app --host 127.0.0.1 --port 8000 --reload
python -m unittest backend.python_api.tests.test_app

# E2E Testing (Playwright)
npm run e2e          # Run all Playwright E2E tests
npx playwright test --ui
npx playwright test --debug
npx playwright show-report
```

> E2E tests can auto-start the dev server through `playwright.config.ts`.

---

## 4. Definition of Done

```text
A FEATURE IS "DONE" ONLY WHEN:
  1. Code works - dev server runs without errors
  2. Tests pass - unit tests cover the new logic
  3. E2E pass - browser tests cover affected UI flows
  4. No regressions - existing features still work
  5. Reviewed - teammate or CTO has seen the code
  6. Screenshots - captured for meaningful GUI changes
```

**Never mark done based on compilation alone.**

---

## 5. Project Structure

```text
memory-game-Team10/
  CLAUDE.md
  AGENTS.md
  README.md
  .env.example
  playwright.config.ts

  .claude/
    settings.local.json
    commands/                # Role and utility commands

  frontend/
    AGENTS.md
    app/
      package.json
      vite.config.ts
      src/
    modules/
      shared/
      game/
      ai/
      ui/

  backend/
    AGENTS.md
    python_api/

  tests/
    e2e/

  docs/
    PRD.md
    ARCHITECTURE.md
    DECISIONS.md
    SKILLS_MATRIX.md
    ui/
      UI_KIT.md
    sprints/
      sprint_01/
```

---

## 6. Environment Variables

Copy `.env.example` to `.env`. Required:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**Security rule:** `ANTHROPIC_API_KEY` must never appear in frontend code or in any `VITE_` variable. All Claude API calls must go through a backend proxy or server-side function.

---

## 7. Game Rules and Data Model

### Difficulty to Grid Size
| Difficulty | Grid | Pairs |
|---|---|---|
| `easy` | 4 x 3 | 6 |
| `medium` | 4 x 4 | 8 |
| `hard` | 6 x 4 | 12 |

### Canonical TypeScript Interfaces

```ts
type Difficulty = "easy" | "medium" | "hard";
type Theme = "animals" | "flags" | "space" | "custom-ai";
type GameStatus = "idle" | "playing" | "paused" | "won";

interface Card {
  id: string;
  pairId: string;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameState {
  cards: Card[];
  flippedIds: string[];
  matchedPairs: number;
  totalPairs: number;
  moves: number;
  timeElapsed: number;
  status: GameStatus;
  difficulty: Difficulty;
  theme: Theme;
}

interface Score {
  moves: number;
  timeElapsed: number;
  difficulty: Difficulty;
  stars: 1 | 2 | 3;
}
```

### Star Rating Formula

```text
easy:   <=12 moves = 3 stars, <=18 moves = 2 stars, else 1 star
medium: <=20 moves = 3 stars, <=30 moves = 2 stars, else 1 star
hard:   <=35 moves = 3 stars, <=50 moves = 2 stars, else 1 star
```

---

## 8. Claude API Usage Rules

### Model
Always use: `claude-sonnet-4-20250514`

### Prompt Templates

**Theme content generator**
```text
Generate {count} unique memory card content items for the theme "{theme}".
Return ONLY a JSON array of strings. No explanation, no markdown, no code fences.
Each string should be short: 1 emoji OR 1-3 words maximum.
```

**Hint system**
```text
The player is stuck in a memory card game.
Board: {totalPairs} pairs total. Found so far: {matchedPairs}. Moves taken: {moves}.
Give ONE cryptic hint (max 15 words). Be playful and encouraging.
Do NOT reveal exact card positions or card content directly.
```

**End-game narrator**
```text
A player just finished a memory game.
Stats: difficulty={difficulty}, pairs={totalPairs}, moves={moves}, time={time}s, stars={stars}/3.
Write exactly 2 sentences reacting to their performance.
Tone: triumphant if 3 stars, encouraging if 2 stars, playful if 1 star.
```

### API Rules
- `max_tokens`: 150 for hints, 100 for narrator, 300 for theme generator
- Always wrap API calls in `try/catch`
- Cache theme content per session for the same theme and difficulty
- Never call the API on card flip events
- Timeout after 8 seconds and show fallback content

---

## 9. Available Slash Commands

| Command | Purpose |
|---|---|
| `/project:cto` | Activate CTO role - architecture, planning, review |
| `/project:architect` | Activate Architect role - module boundaries and shared contracts |
| `/project:techlead_frontend` | Activate Tech Lead Frontend role - UI architecture and state planning |
| `/project:techlead_backend` | Activate Tech Lead Backend role - Claude proxy contracts and secret-safe design |
| `/project:dev` | Activate DEV role - general implementation |
| `/project:dev_frontend` | Activate DEV Frontend role - React UI and gameplay implementation |
| `/project:dev_backend` | Activate DEV Backend role - proxy and backend integration implementation |
| `/project:dev_shared` | Activate DEV Shared role - shared types, utilities, and repo wiring |
| `/project:qa` | Activate QA role - testing and bug discovery |
| `/project:qa_lead` | Activate QA Lead role - release criteria and coverage planning |
| `/project:security_reviewer` | Activate Security Reviewer role - trust boundaries and secret handling |
| `/project:founder` | Activate Founder-support context - option framing and decision support |
| `/project:plan` | Force plan mode before complex work |
| `/project:test` | Run full unit test suite |
| `/project:e2e` | Run Playwright E2E browser tests |

---

## 10. Role Tags

| Tag | Who |
|---|---|
| `[CTO]` | Architecture, tech decisions, code review |
| `[Architect]` | Module boundaries, contracts, and dependency control |
| `[Tech Lead:frontend]` | Frontend architecture, state flows, accessibility |
| `[Tech Lead:backend]` | Python API contracts, validation, secret handling |
| `[DEV]` | Implementation, features, bug fixes |
| `[DEV:shared]` | Shared types, constants, utilities, and toolchain wiring |
| `[DEV:frontend]` | Frontend module implementation |
| `[DEV:backend]` | Backend proxy and integration implementation |
| `[QA]` | Testing, quality gates, bug discovery |
| `[QA Lead]` | Release criteria, regression planning, test coverage ownership |
| `[Security Reviewer]` | Secret exposure review and trust-boundary checks |
| `[FOUNDER]` | Human operator - final decision maker |
| `[FOUNDER-support]` | Decision framing support for the founder |

> Reading order: `frontend/AGENTS.md` -> root `AGENTS.md` -> `docs/PRD.md` -> `docs/SKILLS_MATRIX.md`

---

## 11. Testing Strategy

| Level | Location | Tool | When |
|---|---|---|---|
| **Unit** | `frontend/modules/*/tests/unit/` | Vitest | Every feature |
| **Integration** | `frontend/modules/*/tests/integration/` | Vitest | Cross-module features |
| **E2E** | `tests/e2e/` | Playwright | Every UI change |
### Critical Scenarios to Always Test
- Only 2 cards can be flipped at the same time
- Match detection is correct
- Board shuffle produces the right number of pairs
- Timer starts on first flip and stops on win
- `flippedIds` resets correctly on both match and no-match
- Claude API failure still leaves the game playable

---

## 12. What Not to Do

- Do **not** expose `ANTHROPIC_API_KEY` in frontend code or `VITE_` env vars
- Do **not** call the Claude API on every card flip
- Do **not** allow more than 2 cards in `flippedIds` at once
- Do **not** skip board shuffling on new game
- Do **not** hardcode all card content outside the theme system
- Do **not** silently expand scope beyond the current task
- Do **not** mark features done without running tests
- Do **not** import directly across modules without shared interfaces
