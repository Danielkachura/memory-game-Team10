# Sprint 01 - Task List

CTO creates tasks. DEV executes. QA verifies.

| # | Task | Owner | Complexity | Status | Acceptance Criteria |
|---|---|---|---|---|---|
| 1 | Create project scaffold: `package.json`, Vite app, TS config, Tailwind, Vitest, Playwright wiring | `[DEV:shared]` | Medium | [ ] | `npm run dev`, `npm run test`, and `npx playwright test --list` all work locally |
| 2 | Standardize config on port `5173` across app, docs, and Playwright | `[DEV:shared]` | Small | [ ] | No test or config file references `3000` |
| 3 | Create shared domain module with canonical types and constants | `[DEV:shared]` | Small | [ ] | `Difficulty`, `Theme`, `GameStatus`, `Card`, `GameState`, `Score` are exported from one location |
| 4 | Implement `shuffle` util and tests | `[DEV:shared]` | Small | [ ] | correct pair count, all items preserved, order randomized |
| 5 | Implement `matchCheck` util and tests | `[DEV:shared]` | Small | [ ] | true only when pair IDs match |
| 6 | Implement `scoreCalculator` util and tests | `[DEV:shared]` | Small | [ ] | star thresholds match the spec exactly |
| 7 | Build `useGame` state logic for flip, lock, match, mismatch, reset, and win transitions | `[DEV:frontend]` | Large | [ ] | no third card can flip during resolution and win state is set correctly |
| 8 | Build `GameSetup` flow for difficulty and theme selection | `[DEV:frontend]` | Medium | [ ] | player can choose difficulty and theme before board creation |
| 9 | Build `Card` and `GameBoard` components | `[DEV:frontend]` | Medium | [ ] | grid renders correctly for all difficulty levels |
| 10 | Build `Timer`, `ScorePanel`, and `WinScreen` | `[DEV:frontend]` | Medium | [ ] | timer starts on first flip, stops on win, final stats are accurate |
| 11 | Build shared UI components and app token layer from the UI kit | `[DEV:frontend]` | Medium | [ ] | no reusable component hardcodes design tokens |
| 12 | Create backend Claude proxy module with validation, timeout, and error normalization | `[DEV:backend]` | Large | [ ] | browser never sees secret and proxy fails safely within 8 seconds |
| 13 | Create prompt builders and frontend `claudeClient` wrapper | `[DEV:backend]` | Medium | [ ] | model and token budgets match `CLAUDE.md` |
| 14 | Add AI theme generation with session cache and fallback content | `[DEV:frontend]` | Medium | [ ] | custom theme produces playable cards even if Claude fails |
| 15 | Add AI hint flow with non-blocking UI and fallback message | `[DEV:frontend]` | Medium | [ ] | hint does not alter game state or reveal card positions directly |
| 16 | Add AI end-game narration with fallback message | `[DEV:frontend]` | Small | [ ] | win screen shows 2-sentence recap or fallback |
| 17 | Add unit and integration tests for core logic and AI wrappers | `[QA Lead]` | Medium | [ ] | all high-risk logic has automated coverage |
| 18 | Replace placeholder Playwright test with real MVP flows | `[QA Lead]` | Medium | [ ] | tests cover play-to-win flow and AI failure behavior |
| 19 | Capture demo screenshots and run release checklist | `[QA Lead]` | Small | [ ] | screenshots exist and no release blocker remains |

---

## Dependency Order

1 -> 2 -> 3 -> 4/5/6 -> 7 -> 8/9/10/11 -> 12 -> 13 -> 14/15/16 -> 17/18 -> 19

---

## Release Blockers

These items block a demo sign-off:
- task 1 incomplete
- task 7 incomplete
- task 12 incomplete
- task 18 incomplete
- any exposure of `ANTHROPIC_API_KEY`
