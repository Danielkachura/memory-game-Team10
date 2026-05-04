# TaskFlow Security And Best Practices Report

| Field | Value |
|---|---|
| Review date | 2026-05-04 |
| Requested scope | TaskFlow todo app repository |
| Repository found | No TaskFlow source repository found in the current workspace |
| Evidence reviewed | `simulation.md`, current repo tree, sibling `web-Project` tree |
| Tests run | None for TaskFlow; no TaskFlow app/test files were available |
| Verdict | Blocked for source-level sign-off |

---

## Scope Limitation

The current workspace is `memory-game-Team10`, not a TaskFlow todo app repository. A search for TaskFlow source files found only `simulation.md`, which contains a project simulation and an example security-report prompt. No actual TaskFlow React/Next.js files such as `TodoItem.tsx`, `useTodos.ts`, `app/page.tsx`, or TaskFlow `package.json` were present.

Because the application source code was not available, this report cannot certify the implementation. The findings below are based on the requested requirements and the TaskFlow design described in `simulation.md`.

---

## Findings

### 1. XSS Vulnerabilities

Status: Not verifiable from source.

Expected safe pattern:
- Render task titles as JSX text: `{todo.title}`.
- Avoid `dangerouslySetInnerHTML`.
- Avoid writing task titles through `innerHTML`.

Risk:
- React escapes text rendered through JSX, so plain `{todo.title}` is safe against HTML/script execution.
- If the implementation uses `dangerouslySetInnerHTML`, direct DOM writes, or stores pre-rendered HTML, task titles such as `<img src=x onerror=alert(1)>` could become executable.

Recommendation:
- Add a regression test that creates a task titled `<script>alert(1)</script>` and asserts the literal text is displayed without script execution.

### 2. localStorage Validation

Status: Not verifiable from source.

Risk:
- `JSON.parse(localStorage.getItem(...))` without `try/catch` can crash the app if storage is corrupted.
- Parsed data must not be trusted. A malicious or broken payload can inject wrong shapes, oversized arrays, duplicate IDs, non-string titles, or invalid `completed` values.

Recommendation:
- Validate loaded todos with a schema or explicit type guard.
- Fall back to an empty list on invalid storage.
- Enforce max title length and max todo count after reading from storage.

### 3. Input Validation

Status: Not verifiable from source.

Minimum expected validation:
- Trim task title before saving.
- Reject empty titles.
- Cap title length, for example 120 characters.
- Cap total todos, for example 500.
- Store title as plain text only.

Injection note:
- HTML/script injection through a task title is safe only if the title is rendered as escaped text. Input validation alone is not an XSS control; safe rendering is still required.

### 4. Performance

Status: Not verifiable from source.

Likely React risks in a todo app:
- Entire `TodoList` re-rendering when one item changes.
- Inline callback props causing all `TodoItem` children to re-render.
- Recomputing filtered todos and active counts on every render without memoization.
- Writing to `localStorage` too often or during render instead of effects/event handlers.

Recommendations:
- Wrap `TodoItem` with `React.memo` if the list can grow.
- Use stable callbacks with `useCallback` where they are passed to memoized children.
- Derive filtered todos with `useMemo` when the list is non-trivial.
- Never call `localStorage.setItem` during render.

### 5. Accessibility: WCAG 2.1 AA

Status: Not verifiable from source.

Minimum expected checks:
- Text input has a programmatic label.
- Add/delete/filter buttons have accessible names.
- Delete buttons identify the affected task, for example `aria-label="Delete Buy milk"`.
- Filter buttons expose selected state with `aria-pressed` or tabs semantics.
- Error messages are associated with the input and announced, for example `aria-live`.
- Keyboard-only users can add, toggle, delete, filter, and clear completed tasks.
- Focus states are visible.
- Color contrast meets WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text and UI components.

---

## Test Execution

No TaskFlow tests were available to run.

Attempted discovery:
- Searched current repository for `TaskFlow`, `TodoItem`, `useTodos`, `localStorage`, and todo-related source.
- Checked sibling `web-Project` folder.

Result:
- No TaskFlow app source or test suite was found.

---

## Required Follow-Up For Sign-Off

Provide or place the actual TaskFlow repository in the workspace, then rerun:

```bash
npm test
npm run lint
npm run build
npx playwright test
```

Security-specific tests to add:
- XSS title renders as literal text.
- Corrupted `localStorage` does not crash the app.
- Invalid `localStorage` shapes are discarded.
- Empty and overlong titles are rejected.
- Todo count limit is enforced.
- Keyboard navigation reaches every control.
- Axe or Playwright accessibility checks pass for the main flow.

---

## Current Sign-Off

Not signed off. The requested TaskFlow source code was not available, so this is a scope-limited security report rather than a completed source audit.
