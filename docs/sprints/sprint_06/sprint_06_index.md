# Sprint 06 — Gameplay Stabilization + Modern Dark Mode Mockup

## Goal

Stabilize the playable loop after Sprint 05 by fixing the missing flag gameplay, unblocking player movement, and enforcing the canonical 7×6 board. Additionally implement a **founder-approved Modern Dark Mode** visual upgrade.

## Scope

- Restore a real `flag` unit for each side and end the match immediately when a flag is defeated.
- Fix the stuck player-turn flow so the player can advance legal units into the neutral zone and continue the match.
- Enforce canonical `7×6` board with `14` units per squad in both frontend and backend.
- Remove all real AI/LLM API code paths — the CPU opponent must remain pure local logic only.
- Implement a high-fidelity Modern Dark Mode visual upgrade: new dark palette, glassmorphism right-side dashboard, metallic board border, notification bar, and modern typography (Inter/Poppins).

## Visual Override — Founder Approved (2026-05-05)

The founder requested a Modern Dark Mode mockup based on `image_e5cbc1.png` and mentioned an **8×8 grid**.

**Decision:** The 8×8 reference is treated as a **visual mockup framing device only**. It is NOT implemented in gameplay logic. The canonical board remains **7 columns × 6 rows** as defined in PRD §2 and AGENTS.md. The dark mode visual upgrade applies the new palette and layout composition inspired by the reference image.

This decision is documented as a founder-approved override that does not alter game rules or the board engine.

## Status

- Status: In progress
- Owner: Codex / Nati-Workneh
- Requested on: 2026-05-05

## Acceptance Targets

- Match starts with 28 pieces on a 7×6 board.
- Reveal completes into a playable `player_turn`.
- Each side has exactly one `flag` and one `decoy`.
- Capturing a `flag` ends the match instantly with the correct winner.
- Front-row player units can move into valid neutral cells.
- Zero external API calls — game runs fully offline.
- Dark mode palette (`#1A1F16` background) visible in browser.
- Glassmorphism right-side dashboard with scoreboard, versus bar, stats, and RPS cheat sheet.
- Board has subtle metallic border and inner shadow.
- Notification bar below the board shows system messages.
- 8×8 is NOT implemented in the game engine (documented above).
