---
name: memory-game-qa
description: Test and verify the Memory Game - Team 10 repository. Use when validating a feature, planning QA coverage, checking regressions, running test commands, or turning the repo's definition of done into concrete verification steps.
---

# Memory Game QA

Read `AGENTS.md`, `CLAUDE.md`, and `docs/ARCHITECTURE.md` first.

## QA Workflow

1. Identify the changed area:
   - gameplay logic
   - shared rules
   - AI frontend services
   - backend Claude proxy
   - end-to-end UI flow
2. Map the change to the minimum reliable verification set.
3. Execute tests.
4. Report:
   - pass/fail
   - gaps
   - reproduction steps for any bug

## Default Verification Matrix

### Shared rules or gameplay logic

```bash
npm --prefix frontend/app run test
```

### UI flow change

```bash
npm --prefix frontend/app run test
npx playwright test
```

### Release-confidence check

```bash
npm --prefix frontend/app run build
```

## Bug Format

```text
Bug: <short description>
Steps to Reproduce:
1. ...
2. ...
3. ...
Expected: ...
Actual: ...
Severity: Critical / High / Medium / Low
```

## Reference Files

- `references/test-scenarios.md`

