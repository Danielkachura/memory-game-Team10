# Product Requirements Document (PRD)

> Squad RPS — Team 10 | AIcademy Hackathon 2026

---

## 1. Overview

**Project Name:** Squad RPS — Team 10

**One-line description:** A browser-based 1-vs-Computer tactical Rock-Paper-Scissors squad battle on a 7×6 grid — players observe the battlefield during a brief weapon reveal, then duel character-by-character to find and defeat the hidden Flag-bearer while watching out for the Decoy.

**Problem:** Classic Rock-Paper-Scissors is a 1-shot coin flip — pure luck, zero strategy, zero replay value. We want an RPS-based game that rewards observation, memory, and tactical decision-making, while staying instantly understandable.

**Target Users:**
- Casual gamers who want a quick (2–4 minute) tactical match in the browser
- Fans of hidden-information games (Stratego, Battleship, Coup) who want a faster format
- Hackathon judges and demo-watchers who can grasp the rules in under 30 seconds

**AI Policy:** This project does NOT use any AI/LLM API. The computer opponent is driven entirely by local deterministic logic with configurable difficulty levels. All squad generation is also local — no external API calls.

---

## 2. The Board

- **Grid:** 7 columns × 6 rows (7×6 = 42 squares total).
- **Player 1 (Human):** Starts on **rows 1–2** (the bottom two rows) — 14 squares.
- **Computer (Player 2):** Starts on **rows 5–6** (the top two rows) — 14 squares.
- **Rows 3–4:** Neutral battle zone — empty at the start.
- **Team Size:** 14 characters per side — **28 characters on the board total** at match start.

```
Row 6 │ CPU  CPU  CPU  CPU  CPU  CPU  CPU  ← CPU back row
Row 5 │ CPU  CPU  CPU  CPU  CPU  CPU  CPU  ← CPU front row
Row 4 │ ·    ·    ·    ·    ·    ·    ·   ← Neutral zone
Row 3 │ ·    ·    ·    ·    ·    ·    ·   ← Neutral zone
Row 2 │ P1   P1   P1   P1   P1   P1   P1  ← Player front row
Row 1 │ P1   P1   P1   P1   P1   P1   P1  ← Player back row
        C1   C2   C3   C4   C5   C6   C7
```

---

## 3. Game Concept (Core Mechanic)

Every character on the board holds one weapon: 🪨 Rock, 📄 Paper, or ✂️ Scissors.

After the initial reveal, two of the characters in each squad are secretly assigned special roles:
- 🚩 **Flag-bearer** — one per squad. If defeated in a duel, that side **loses immediately**.
- 🎭 **Decoy** — one per squad. The Decoy **survives every attack** — the attacker can still die if RPS goes against them.

The remaining 12 characters in each squad are normal soldiers — standard RPS rules apply.

---

### Phase 1 — Weapon Reveal (10 seconds)

- All 28 characters shown with weapons visible. Board locked, no actions possible.
- Player uses this time to memorize the enemy lineup.
- 10-second countdown displayed prominently.

### Phase 2 — Role Assignment & Hide

- Weapons hidden. System assigns 1 Flag + 1 Decoy per squad randomly.
- **Player** sees their own weapons and role markers. Enemy side = silhouettes only.
- Backend is the source of truth for hidden state.

### Phase 3 — Duel Rounds

On your turn:
1. Click one of your alive characters → attacker.
2. Click one of the enemy's alive characters → target.
3. Both weapons revealed for this duel only.
4. RPS resolution — loser eliminated, winner's weapon hidden again.
5. **Tie:** both re-pick a new weapon and duel again.
6. **Decoy** hit: duel resolves for the attacker; Decoy stays on board.
7. **Flag** eliminated: instant match end.

**Win conditions:**
1. Defeat the enemy Flag-bearer → instant win.
2. Lose your own Flag → instant loss.
3. Stalemate (only enemy Decoy remains) → Decoy becomes killable.

---

## 4. Computer Opponent — No AI, Local Logic Only

| Level | Behavior |
|---|---|
| **Easy** | Random valid move every turn |
| **Medium** | Remembers revealed weapons; prefers winning matchups |
| **Hard** | Remembers + hunts player's Flag |

---

## 5. Squad Generation — Local Only

Squads generated locally from hardcoded name pools.
Weapon distribution: at least 4 rock, 5 paper, 5 scissors per squad (or similar balanced split for 14).
No external API calls.

---

## 6. Core Features

| # | Feature | Priority |
|---|---|---|
| 1 | 7×6 Board & Starting Positions | Must Have |
| 2 | Weapon Reveal Phase (10s countdown) | Must Have |
| 3 | Role Assignment (Flag + Decoy per squad) | Must Have |
| 4 | Asymmetric Visibility | Must Have |
| 5 | Duel Engine (RPS + tie re-pick loop) | Must Have |
| 6 | Flag & Decoy Rules | Must Have |
| 7 | Hidden-Info Enforcement (server-side) | Must Have |
| 8 | Local Computer Opponent (3 difficulty levels) | Must Have |
| 9 | Match Timer & Stats | Must Have |
| 10 | Match Result Screen | Must Have |

---

## 7. Sprint Plan

| Sprint | Theme | Deliverable |
|---|---|---|
| **Sprint 01** | Board Foundation | 7×6 grid, 14 red pieces rows 1–2, 14 blue pieces rows 5–6, rows 3–4 neutral, click-to-select |
| **Sprint 02** | Weapons + Reveal | Weapon icons on pieces, 10s reveal countdown, hide animation |
| **Sprint 03** | Roles + Duel Engine | Flag & Decoy, duel flow, RPS resolution, ties, Decoy, Flag instant-win |
| **Sprint 04** | CPU Opponent Easy | Random valid moves, full game loop, game over screen |
| **Sprint 05** | CPU Medium + Hard | Difficulty logic, match stats, Play Again, final QA sign-off |

---

## 8. Technical Constraints

- **Stack:** React + TypeScript (frontend), Python + FastAPI (backend)
- **No AI APIs**
- **Runs locally** on `localhost`
- **Backend is source of truth** for all hidden state

---

## 9. Success Criteria

- [ ] Board renders 7×6 with correct starting positions (14 per side)
- [ ] Rows 3–4 empty (neutral zone)
- [ ] Full match playable start to finish
- [ ] Weapon reveal timer exactly 10 seconds
- [ ] Asymmetric visibility enforced
- [ ] Flag: instant win/loss on death
- [ ] Decoy: survives every attack
- [ ] Tie: both re-pick until non-tie
- [ ] CPU makes legal moves on all 3 difficulty levels
- [ ] Zero external API calls
