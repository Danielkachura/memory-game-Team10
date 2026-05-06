# Test Scenarios

## Must-Cover Flows

1. Setup screen loads and starts a game
2. Ordered easy deck can be completed and reaches win state
3. Mismatched cards flip back down after the delay
4. Hint request shows fallback text when Claude is unavailable
5. Custom AI theme failure still yields a playable board

## Regression Questions

- Did a change break the selected difficulty's grid dimensions?
- Did move counting change on first or second flip?
- Did the timer start too early or stop too late?
- Did a fallback path regress from graceful text to a broken state?
- Did a frontend change require updating Playwright coverage?

