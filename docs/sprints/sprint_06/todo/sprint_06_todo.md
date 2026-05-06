# Sprint 06 TODO

## A — Gameplay Stabilization

- [x] Align shared board constants to `7×6` and `14` units per side.
  Acceptance: frontend and backend use the same board dimensions and squad size.

- [x] Restore visible player-side role assignment after reveal.
  Acceptance: after reveal, the player can identify exactly one of their own units as `flag` and one as `decoy`.

- [x] Enforce flag victory conditions end-to-end.
  Acceptance: defeating the enemy `flag` shows an immediate win; losing the player's `flag` shows an immediate loss.

- [x] Fix the stuck player-turn interaction.
  Acceptance: at least one alive front-row player unit can be selected and moved into a highlighted legal neutral square at match start.

- [x] Remove all real AI/LLM API code paths from `backend/python_api/app.py`.
  Acceptance: the file no longer imports `call_claude_text` or `ClaudeProxyError`; game runs with no API key.

- [x] Fix Sidebar unit count — `total` was hardcoded to 10, should be 14.
  Acceptance: TeamCount health bars calculate percentage from 14, not 10.

- [x] Add regression coverage for board size, flag assignment, and legal opening movement.
  Acceptance: automated backend and frontend tests cover the canonical setup and opening move path.

## B — Modern Dark Mode Visual Upgrade (Founder-Approved Override)

- [x] Implement new dark mode CSS design tokens in `styles.css`.
  Acceptance: `--color-board-bg: #1A1F16`, board squares use `#3D4A32` / `#2A3323`, team accents are `#FF4B4B` / `#00A3FF`.

- [x] Add Inter/Poppins modern typography via Google Fonts in `index.html`.
  Acceptance: headings and body text render in Inter/Poppins on a live browser.

- [x] Replace right sidebar with unified glassmorphism dashboard.
  Acceptance: sidebar shows opponent profile, RPS logo, scoreboard, versus bar, stats table, RPS cheat sheet, and settings icon.

- [x] Add subtle metallic border and inner shadow to the game board.
  Acceptance: board renders with `inset` box-shadow and thin rgba border.

- [x] Add subtle glow indicator under selectable player units.
  Acceptance: player unit cells show a soft ring glow when the unit is clickable.

- [x] Add a dedicated rounded notification bar below the board.
  Acceptance: bar shows live system messages (e.g., "Fog of war is active", current phase info).

## C — 8×8 Grid Clarification (Founder Request)

- [x] Document that 8×8 is used as visual mockup framing only, not as a game-engine change.
  Acceptance: `sprint_06_index.md` contains the founder-approved override note; gameplay remains 7×6.
