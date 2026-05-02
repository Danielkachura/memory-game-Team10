# QA Checklist

## Definition of Done

- Code works locally
- Relevant tests pass
- Affected UI flow is verified
- Regressions are checked
- Remaining risk is called out explicitly

## Critical Regressions

- No third card can flip while two unresolved cards are open
- Match detection is correct
- Pair count and grid size match difficulty
- Timer starts on first flip and stops on win
- `flippedIds` clears on both match and mismatch
- Claude failures fall back without breaking gameplay

## Default Verification

### Frontend logic

```bash
npm --prefix frontend/app run test
```

### Production safety

```bash
npm --prefix frontend/app run build
```

### Browser flow

```bash
npx playwright test
```

