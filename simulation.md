# סימולציה מלאה: בניית Todo App עם סוכני AI

## הפרויקט: Todo App (Next.js + React + TypeScript)

---

## 🟣 שלב 1: Claude Projects — הגדרת סוכן CTO

### איפה: claude.ai → Projects → New Project

### מה מדביקים ב-System Prompt:

```
# Identity
You are the CTO of the "TaskFlow" Todo App project.

# Scope
- Architecture decisions (tech stack, folder structure, data flow)
- Sprint planning (break features into tasks, estimate complexity)
- Code review using the Good/Bad/Ugly framework
- Quality gates enforcement

# Tech Stack
- Frontend: Next.js 14 (App Router) + React + TypeScript
- Styling: Tailwind CSS
- Database: SQLite (dev) → Turso (prod)
- Testing: Vitest + Playwright
- Deployment: Vercel

# Rules
1. Every feature MUST have tests before implementation (TDD)
2. Test coverage must be ≥80%
3. No code goes to production without passing all tests
4. Every sprint ends with a Good/Bad/Ugly code review
5. Components must be small, reusable, and typed
6. API routes must validate input and handle errors

# Reading Order
When given project docs, read in this order:
1. PRD (product requirements)
2. Architecture document
3. Module breakdown
4. Testing strategy

# Output Format
When planning sprints, output:
1. Sprint goal (one sentence)
2. dev_todo.md — numbered task list for developers
3. qa_todo.md — numbered test scenarios for QA
4. Architecture notes — any technical decisions made

When reviewing code, output:
- ✅ Good: what's done well
- ⚠️ Bad: what needs improvement
- 🔴 Ugly: what must be fixed before shipping
```

### מה מעלים ל-Project Knowledge:

קובץ בשם `PRD.md`:

```markdown
# TaskFlow — Product Requirements Document

## Overview
A simple, fast todo application for personal task management.

## Core Features (MVP)
1. Add a new task (title only, no description needed)
2. Mark task as complete / incomplete (toggle)
3. Delete a task
4. Filter tasks: All / Active / Completed
5. Show task count ("3 tasks remaining")
6. Clear all completed tasks

## Non-Functional Requirements
- Mobile-responsive (works on phone + desktop)
- Accessible (keyboard navigation, screen reader friendly)
- Fast (no loading spinners for local operations)
- Data persists on page refresh (localStorage for MVP)

## Out of Scope (for now)
- User accounts / authentication
- Categories or tags
- Due dates
- Drag-and-drop reorder
```

---

### 🗣️ שיחה ראשונה עם סוכן ה-CTO:

**אתה כותב:**
```
Here is our PRD. Plan Sprint 1 — what should the dev team build first?
Create dev_todo.md and qa_todo.md.
```

**הסוכן CTO מחזיר (דוגמה):**

```markdown
## Sprint 1 Goal
Build a fully functional todo list with add, toggle, delete, 
and filter — all with tests passing.

---

### dev_todo.md

#### Sprint 1 — Development Tasks

- [ ] 1. Project setup: `npx create-next-app@latest taskflow --typescript --tailwind --app`
- [ ] 2. Create `TodoItem` component 
       - Props: `{ id, title, completed, onToggle, onDelete }`
       - Renders checkbox, title text, delete button
       - Write test FIRST: renders correctly, toggle fires callback, delete fires callback
- [ ] 3. Create `TodoList` component
       - Props: `{ todos, onToggle, onDelete }`
       - Maps over todos and renders TodoItem for each
       - Write test FIRST: renders correct number of items, empty state message
- [ ] 4. Create `AddTodo` component
       - Input field + submit button
       - Validates: no empty titles
       - Write test FIRST: input works, submit fires callback, clears after submit
- [ ] 5. Create `TodoFilter` component
       - Three buttons: All / Active / Completed
       - Highlights active filter
       - Write test FIRST: renders 3 buttons, click changes filter
- [ ] 6. Create `TodoCounter` component
       - Shows "X tasks remaining" (active count)
       - Write test FIRST: shows correct count
- [ ] 7. Create `useTodos` custom hook
       - State: todos array + filter
       - Actions: add, toggle, delete, setFilter, clearCompleted
       - Persists to localStorage
       - Write test FIRST: all actions work correctly
- [ ] 8. Assemble main page (`app/page.tsx`)
       - Wire all components together using useTodos hook
       - Integration test: full user flow works
- [ ] 9. Responsive styling with Tailwind
       - Mobile: single column, full-width input
       - Desktop: centered card, max-width 640px
- [ ] 10. Run full test suite — all tests must pass

---

### qa_todo.md

#### Sprint 1 — QA Test Scenarios

- [ ] 1. Add task: type "Buy milk" → click Add → task appears in list
- [ ] 2. Add empty task: click Add with empty input → nothing happens, shows error
- [ ] 3. Toggle task: click checkbox → task shows strikethrough
- [ ] 4. Toggle back: click checkbox again → strikethrough removed
- [ ] 5. Delete task: click delete → task removed from list
- [ ] 6. Filter Active: only incomplete tasks shown
- [ ] 7. Filter Completed: only completed tasks shown
- [ ] 8. Filter All: all tasks shown
- [ ] 9. Counter: shows correct "X tasks remaining" after add/toggle/delete
- [ ] 10. Persistence: add tasks → refresh page → tasks still there
- [ ] 11. Clear completed: click "Clear completed" → only active tasks remain
- [ ] 12. Mobile: resize to 375px → layout doesn't break
- [ ] 13. Keyboard: tab through all controls → all reachable
```

---

## 🟢 שלב 2: Claude Code — פיתוח (Dev Agent)

### איפה: Terminal (command line)

### מה כותבים:

```bash
# פותחים Claude Code בתיקיית הפרויקט
cd ~/projects/taskflow
claude
```

### פרומפט ראשון — Setup:

```
Read the file docs/sprint_01/dev_todo.md.

Start with task 1: Initialize the Next.js project with TypeScript 
and Tailwind. Then move to task 2.

For EVERY task:
1. Write the test file FIRST
2. Run the test — confirm it FAILS (red)
3. Write the implementation
4. Run the test — confirm it PASSES (green)
5. Move to the next task

Use Vitest for unit tests. Show me the test results after each task.
```

**Claude Code עושה (בפועל):**
```
> Creating project with npx create-next-app...
> Installing vitest and @testing-library/react...
> 
> Task 2: TodoItem component
> Creating test: src/components/__tests__/TodoItem.test.tsx
> Running test... ❌ FAIL (component doesn't exist yet)
> Creating: src/components/TodoItem.tsx
> Running test... ✅ PASS (3/3 tests passing)
>
> Task 3: TodoList component  
> Creating test: src/components/__tests__/TodoList.test.tsx
> Running test... ❌ FAIL
> Creating: src/components/TodoList.tsx
> Running test... ✅ PASS (2/2 tests passing)
> ...
```

### פרומפט שני — אם נתקע:

```
Task 7 test is failing on localStorage persistence. 
Fix the useTodos hook — make sure it reads from localStorage 
on mount and writes on every change. Run the test again.
```

### פרומפט שלישי — דוח סופי:

```
All tasks are done. Generate a dev report:
1. What was built (list of components + files)
2. Test results (how many pass/fail)
3. Coverage percentage
4. Any known issues or shortcuts taken
```

**Claude Code מחזיר:**
```markdown
## Dev Report — Sprint 1

### Built:
- 5 components: TodoItem, TodoList, AddTodo, TodoFilter, TodoCounter
- 1 custom hook: useTodos
- 1 page: app/page.tsx
- 6 test files, 23 test cases

### Test Results:
✅ 23/23 tests passing
Coverage: 87%

### Known Issues:
- TodoItem delete button has no confirmation dialog
- No animation on task toggle (could improve UX)
```

---

## 🟣 שלב 3: חזרה ל-Claude Projects — סקירת CTO

### איפה: Claude Projects (אותו פרויקט CTO)

### מה כותבים:

```
Here is the dev report and the source code from Sprint 1.
Do a Good/Bad/Ugly code review.

[מדביקים את הקוד של הקומפוננטות העיקריות]

Focus on:
- Component architecture (are they reusable?)
- Error handling (what happens with bad input?)
- TypeScript types (are they strict enough?)
- Test quality (do tests cover edge cases?)
```

**סוכן CTO מחזיר:**

```markdown
## Code Review — Sprint 1

### ✅ Good
- Clean component separation — each has single responsibility
- TDD approach followed consistently 
- useTodos hook properly encapsulates all state logic
- TypeScript interfaces defined for Todo type
- 87% coverage exceeds our 80% gate

### ⚠️ Bad
- AddTodo: no debounce on rapid submissions — user could 
  create duplicates by double-clicking
- TodoFilter: filter state is a string literal "all" | "active" | 
  "completed" — should be an enum or const object
- No error boundary — if a component crashes, entire app dies
- localStorage.setItem not wrapped in try/catch — 
  will crash in private browsing if storage is full

### 🔴 Ugly
- DELETE: TodoItem delete has no confirmation — users WILL 
  accidentally delete tasks. Must fix before shipping.
- useTodos: clearCompleted doesn't update localStorage 
  immediately — stale data on refresh after clearing. 
  This is a DATA LOSS BUG. Fix now.

### Verdict: Fix Ugly items → re-test → ship.
```

---

## 🟡 שלב 4: Codex (OpenAI) — מחקר ואבטחה

### איפה: chatgpt.com/codex (או Codex CLI)

### מה כותבים:

```
Review the TaskFlow todo app repository for security 
and best practices.

Focus on:
1. XSS vulnerabilities — is user input sanitized before rendering?
2. localStorage — is data validated when read back?
3. Input validation — can someone inject HTML/scripts via task title?
4. Performance — any unnecessary re-renders in React components?
5. Accessibility — does the app meet WCAG 2.1 AA?

Run tests if available. Create a security report.
```

**Codex מחזיר (רץ בענן, בודק את הקוד):**

```markdown
## Security & Best Practices Report

### 🔴 Critical
1. **XSS Risk**: Task titles are rendered with `{todo.title}` in JSX — 
   React auto-escapes this, so ✅ safe. BUT if you later use 
   `dangerouslySetInnerHTML` — it will be vulnerable.

2. **localStorage Validation**: Data read from localStorage is not 
   validated with a schema. If localStorage is corrupted or tampered 
   with, the app will crash.
   → Fix: Add Zod schema validation on read.

### ⚠️ Warnings
3. **No rate limiting on add**: A script could add thousands of todos 
   and fill localStorage (5MB limit).
   → Fix: Add max todo limit (e.g., 500).

4. **Re-renders**: TodoList re-renders all items when any item changes.
   → Fix: Wrap TodoItem in React.memo.

5. **Accessibility**: 
   - ✅ Buttons have labels
   - ⚠️ Filter buttons don't indicate current state to screen readers 
     (need aria-pressed)
   - ⚠️ Delete button says "Delete" but doesn't say WHICH task 
     (need aria-label="Delete Buy milk")

### Recommendations
- Add Zod for localStorage validation
- Add React.memo to TodoItem
- Add aria-pressed to filter buttons
- Add aria-label with task name to delete buttons
- Set max todo limit to 500
```

---

## 🟢 שלב 5: חזרה ל-Claude Code — תיקונים

### איפה: Terminal

### מה כותבים:

```
Fix these issues from code review:

URGENT (Ugly):
1. Add confirmation dialog before delete
2. Fix clearCompleted — must update localStorage immediately

SECURITY:
3. Add Zod validation when reading from localStorage
4. Add max 500 todos limit
5. Wrap TodoItem in React.memo

ACCESSIBILITY:
6. Add aria-pressed to filter buttons
7. Add aria-label="Delete {taskName}" to delete buttons

After all fixes — run full test suite and report results.
```

---

## 🚀 שלב 6: Deploy

### איפה: Terminal

```bash
# After all tests pass
vercel --prod
```

---

## Summary: מה כותבים איפה

| כלי | תפקיד | מה כותבים שם |
|-----|--------|-------------|
| **Claude Projects** | CTO Agent | System prompt + PRD → מקבלים sprint plan, todo lists, code reviews |
| **Claude Code** | Dev Agent | פרומפטים לבנייה: "קרא todo, כתוב בדיקה, ממש, הרץ" |
| **Codex** | Security/Research | "בדוק את הריפו — אבטחה, ביצועים, נגישות" |
| **Claude Projects** | CTO Review | "הנה הקוד — תן Good/Bad/Ugly" |
| **Claude Code** | Fix + Ship | "תתקן את הבעיות, הרץ בדיקות, vercel --prod" |
