# Run E2E Tests

Run end-to-end browser tests for the **Memory Game - Team 10** project using Playwright.

## Steps

1. Check that Playwright is installed.
2. Check `playwright.config.ts` for `baseURL` and `webServer`.
3. Run:

```bash
npx playwright test
```

4. Report:

```text
## E2E Test Results

Status: PASS / FAIL
Tests run: X
Passed: X
Failed: X

Failures:
- test_name - what went wrong

Screenshots:
- Capture only when the flow or bug requires visual evidence
```

## Useful Commands

```bash
npx playwright test
npx playwright test --debug
npx playwright test --ui
npx playwright test --project=chromium
npx playwright test tests/e2e/example.spec.ts
npx playwright show-report
```

## Notes

- E2E specs live in `tests/e2e/`.
- Visual artifacts can be written to `tests/screenshots/` when needed.
- The dev server should run on port `5173`.
