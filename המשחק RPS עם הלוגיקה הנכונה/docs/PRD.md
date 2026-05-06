# Product Requirements Document (PRD)

> Squad RPS — Team 10 | AIcademy Hackathon 2026
> _(formerly: Memory Game — pivoted 2026-04-29)_

---

## 1. Overview

**Project Name:** Squad RPS — Team 10

**One-line description:** A browser-based 1-vs-AI Rock-Paper-Scissors squad battle on a 5×6 grid, inspired by ICQ-era RPS and Stratego — players observe the battlefield during a brief weapon reveal, then duel character-by-character to find and defeat the hidden Flag-bearer while watching out for the Decoy.

**Problem:** Classic Rock-Paper-Scissors is a 1-shot coin flip — pure luck, zero strategy, zero replay value. There is no memory, no bluff, no game state to think about. We want an RPS-based game that rewards observation, memory, and tactical decision-making, while staying instantly understandable.

**Target Users:**
- Casual gamers who want a quick (2–4 minute) tactical match in the browser
- Fans of hidden-information games (Stratego, Battleship, Coup) who want a faster format
- Hackathon judges and demo-watchers who can grasp the rules in under 30 seconds

---

## 2. The Board

- **Grid:** 5 columns × 6 rows (5×6 = 30 squares total).
- **Player 1 (Human):** Starts on **rows 1–2** (the bottom two rows) — 10 squares, fully populated with the player's 10 characters at match start.
- **AI (Player 2 / Claude):** Starts on **rows 5–6** (the top two rows) — 10 squares, fully populated with the AI's 10 characters at match start.
- **Rows 3–4:** Neutral battle zone — empty at the start, where pieces meet during duels (movement rules TBD; for MVP, attacks are direct selection without movement — see Section 8).
- **Team Size:** 10 characters (pieces) per side — **20 characters on the board total** at match start.
- **Each square holds at most one character.**

```
Row 6 │ AI    AI    AI    AI    AI     ← AI back row
Row 5 │ AI    AI    AI    AI    AI     ← AI front row
Row 4 │ ·     ·     ·     ·     ·      ← Neutral battle zone
Row 3 │ ·     ·     ·     ·     ·      ← Neutral battle zone
Row 2 │ P1    P1    P1    P1    P1     ← Player front row
Row 1 │ P1    P1    P1    P1    P1     ← Player back row
        Col1  Col2  Col3  Col4  Col5
```

---

## 3. Game Concept (Core Mechanic)

Every character on the board holds one weapon: 🪨 Rock, 📄 Paper, or ✂️ Scissors.

After the initial reveal, two of the characters in each squad are secretly assigned special roles:
- 🚩 **Flag-bearer** — one randomly selected character per squad. If they are defeated in a duel, that side **loses immediately**.
- 🎭 **Decoy** — another randomly selected character per squad. The Decoy survives the entire match — **it does not die from being attacked**. When attacked, the duel resolves but the Decoy stays on the board (the attacker still loses if RPS would have killed them). Used to bait, mislead, and waste enemy turns.

The remaining 8 characters in each squad are normal soldiers — standard RPS rules apply.

---

### Phase 1 — Weapon Reveal (10 seconds)

- All 20 characters are shown on the 5×6 board (rows 1–2 and 5–6 fully occupied), each holding their weapon **forward** so both players can see it.
- A 10-second countdown is displayed.
- **No special roles are assigned yet** — everyone is just a character with a weapon.
- The board is locked; no actions are possible.
- The player should use this time to memorize who-holds-what on the enemy side (rows 5–6).

### Phase 2 — Role Assignment & Hide

- The 10 seconds expire. All characters **bring their weapons behind their back** (weapons hidden — the characters themselves stay on the board, no card-flip animation).
- **Now** the system randomly assigns roles: 1 Flag-bearer + 1 Decoy per squad (the other 8 stay as normal soldiers).
- **Asymmetric visibility:**
  - **The player** sees their own characters (rows 1–2) holding their weapons behind their backs *visible to the player only*. Flag and Decoy markers are also shown to the player on their two role-holders. The enemy side (rows 5–6) is fully hidden — no weapons, no roles, just character silhouettes.
  - **The AI opponent** sees its own characters (rows 5–6) with weapons + roles, and sees the player's side (rows 1–2) as silhouettes only — no weapons, no roles.
- Neither side ever sees the other's hidden state.

### Phase 3 — Duel Rounds

Players take turns. On your turn:

1. Click one of your alive characters → select attacker.
2. Click one of the enemy's alive characters → select target.
3. Both characters bring their weapons forward — **both players now see both weapons** for that duel only.
4. RPS resolution:
   - **Winner stays** on the board. After the duel resolves, **the winner's weapon is hidden again** (back behind their back). The opponent does NOT permanently learn the winner's weapon.
   - **Loser is eliminated** — character disappears from the board, that square becomes empty. Their identity (role) is revealed at the moment of death.
   - **Tie:** both players pick a **new weapon** for that same pair of characters and re-duel. This repeats until one wins — there is no "tie ends the duel" outcome.
5. Special role outcomes:
   - If the eliminated character was the **Flag-bearer** → match ends instantly, that side loses.
   - If the target was the **Decoy** → duel resolves normally for the attacker (attacker dies if they would have lost the RPS), but the Decoy itself never dies and stays on the board. The Decoy works this way for the entire match.
6. Turn passes to the opponent.

**Win conditions:**
1. Defeat the enemy Flag-bearer → instant win.
2. Lose your own Flag → instant loss.
3. Stalemate edge case (only enemy Decoy remains, your Flag alive) — see Section 8.

---

## 4. Core Features

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | 5×6 Board & Starting Positions | Render the grid; place 10 player chars on rows 1–2, 10 AI chars on rows 5–6, rows 3–4 empty | Must Have |
| 2 | Weapon Reveal (Phase 1) | All 20 characters show weapons forward for 10 seconds with countdown | Must Have |
| 3 | Role Assignment (Phase 2) | After the 10s, randomly assign 1 Flag + 1 Decoy per squad; hide weapons behind back | Must Have |
| 4 | Asymmetric Visibility | Each side sees only their own weapons + roles; enemy side is silhouettes only | Must Have |
| 5 | Duel Engine (RPS) | Click-to-attack flow, weapons-forward animation, RPS resolution, tie re-pick loop | Must Have |
| 6 | Flag & Decoy Rules | Flag death = instant loss; Decoy is invulnerable for the whole match | Must Have |
| 7 | Hidden-Info Enforcement | After a winning duel, the winner's weapon hides again — no permanent reveals | Must Have |
| 8 | AI-Generated Squads | Claude generates a roster of 20 characters with names, weapons, art descriptions per match | Must Have |
| 9 | AI Opponent (Claude plays) | Claude picks the AI's moves each turn — including which character to attack with and which target to hit, with bluff/memory behavior | Must Have |
| 10 | Match Timer & Stats | Track match duration, duels won/lost, ties, outcome at end-game | Must Have |
| 11 | Difficulty Levels | Easy / Medium / Hard — affects Claude's strategy prompt (random vs memory-aware vs bluffing) | Nice to Have |

---

## 5. User Stories

### Story 1: The Reveal
> As a player, I want to see all 20 characters on the 5×6 board with their weapons held forward for 10 seconds, so that I can try to memorize the enemy's lineup.

**Acceptance Criteria:**
- [ ] At match start, the 5×6 board renders with 10 characters on rows 1–2 (player) and 10 characters on rows 5–6 (AI); rows 3–4 are empty
- [ ] All 20 characters show weapon icons (🪨 / 📄 / ✂️) clearly visible — held forward
- [ ] A 10-second countdown is displayed prominently
- [ ] During reveal, no actions are possible (board is locked) and no roles are assigned yet
- [ ] At T=0, all characters bring their weapons behind their back simultaneously (smooth animation, < 600ms) — characters themselves stay visible on the board
- [ ] After hide animation, system assigns 1 Flag + 1 Decoy per squad randomly
- [ ] On the player's side: the player still sees their own characters' weapons (held behind back, visible to the player only), and Flag/Decoy markers appear on the two role-holders
- [ ] On the enemy side: everything is hidden — no weapons, no role markers, just silhouettes
- [ ] A clear "Your turn" prompt appears when role assignment is complete

### Story 2: Attacking with a Character
> As a player, I want to pick one of my characters and attack one of the enemy's, so that I can resolve a duel and make progress toward finding their Flag.

**Acceptance Criteria:**
- [ ] On my turn, I can click one of my (alive) characters to select an attacker
- [ ] Selected attacker is visually highlighted
- [ ] I can then click an enemy character (alive, on the board) to target
- [ ] A duel animation plays (~1s): both characters bring weapons forward — both players see both weapons for this duel
- [ ] RPS rules resolve and the outcome is shown clearly
- [ ] On a tie, both players choose a new weapon and re-duel; this repeats until someone wins
- [ ] The losing character disappears from the board (their square becomes empty)
- [ ] The surviving character's weapon hides again (back behind their back) — no permanent reveal to the opponent
- [ ] If the loser was the Flag, the match-end "You Win!" / "You Lose!" screen appears
- [ ] If the target was the Decoy, the Decoy stays on the board no matter what (only the attacker can die in that duel)
- [ ] Turn passes to the AI opponent

### Story 3: AI-Generated Squads
> As a player, I want a freshly-generated squad each match so that no two games feel identical.

**Acceptance Criteria:**
- [ ] On match start, frontend calls `POST /api/squad/generate`
- [ ] Claude returns 2 squads × 10 characters (20 total), each with: `name`, `weapon` (rock/paper/scissors), short visual description
- [ ] Roles (1 Flag, 1 Decoy per squad) are NOT assigned at this stage — they are assigned by the backend after Phase 1 ends
- [ ] Weapon distribution is balanced per squad (no degenerate distributions like 10×rock — at least 2 of each weapon per squad)
- [ ] Loading state shown during generation (~2–4s)
- [ ] If API fails, fallback to a built-in default roster set

### Story 4: AI Opponent Plays
> As a player, I want Claude to play as my opponent — picking moves that feel like a real player, not just random clicks.

**Acceptance Criteria:**
- [ ] When it's the AI's turn, frontend calls `POST /api/ai/move` with the game state visible to the AI
- [ ] Claude returns a move: `{ attackerId, targetId }` plus a short reasoning string (for debug/log)
- [ ] AI receives only what a human opponent would see: own squad (with own roles + weapons), enemy squad as on-board silhouettes only, history of past duels (only weapons revealed during those duels)
- [ ] AI never receives the player's hidden roles or hidden weapons — enforced server-side
- [ ] AI move is returned within 3 seconds (timeout → fallback to random valid move)
- [ ] On a tie, AI also picks a new weapon for the re-duel via the same endpoint
- [ ] AI behavior scales with difficulty: Easy = random valid, Medium = remembers weapons revealed during past duels, Hard = remembers + bluffs (sometimes attacks with weak weapon to bait)

### Story 5: Match End & Stats
> As a player, I want to see the result and a stat summary at the end, so that I know how the match went and can play again.

**Acceptance Criteria:**
- [ ] On match end, a result screen shows Win / Loss + reason ("You captured the enemy Flag!" / "Your Flag was defeated")
- [ ] Stats shown: match duration, duels won, duels lost, tie sequences, attacks absorbed by the Decoy
- [ ] "Play Again" button starts a new match
- [ ] All enemy roles and weapons are revealed on the result screen (no hidden info anymore)

---

## 6. Out of Scope

- Online multiplayer (real-time human vs human via WebSockets) — AI opponent only
- Hot-seat 2-player mode on same device (hidden info breaks if both players share a screen)
- User accounts, login, persistent stats/leaderboards across sessions
- Mobile native app — browser only
- Custom squad sizes (always 10 per side, 20 total)
- Custom role mixes (always exactly 1 Flag, 1 Decoy, 8 soldiers per side)
- Custom board sizes (always 5×6)
- Player-selected themes — Claude generates a roster on its own each match
- Animated character art beyond static SVG/emoji + name
- Movement mechanics (for MVP, attacks are direct target selection — see Section 8)

---

## 7. Success Criteria

- [ ] A full match can be played from start to finish (reveal → role assignment → duels → result) without errors
- [ ] Board correctly renders 5×6 with player on rows 1–2, AI on rows 5–6, rows 3–4 empty
- [ ] AI-generated squads load successfully across multiple matches with valid weapon distribution
- [ ] AI opponent makes legal moves every turn, never reveals hidden info, handles ties correctly
- [ ] Reveal timer is exactly 10 seconds, hide animation completes cleanly, role assignment happens after hide
- [ ] Asymmetric visibility verified: client never receives enemy roles or hidden weapons
- [ ] Flag mechanic: instant win/loss on Flag death, verified end-to-end
- [ ] Decoy mechanic: Decoy survives every attack, attacker dies on losing RPS, Decoy never dies
- [ ] Tie mechanic: both sides re-pick weapons until a non-tie outcome
- [ ] Hidden-info: winner's weapon is hidden again after each duel, no permanent reveals
- [ ] Game is playable in Chrome/Firefox without installation
- [ ] E2E Playwright tests cover: full match win-by-flag, tie-resolution loop, decoy interaction
- [ ] No API keys exposed in frontend code

---

## 8. Technical Constraints

- **Must use:** Claude API (`claude-sonnet-4-20250514`) for both squad generation AND opponent move selection
- **Must not use:** No paid third-party APIs beyond Anthropic
- **Must run on:** Modern desktop browser (Chrome, Firefox, Safari)
- **Stack:** React + TypeScript (frontend), **Python + FastAPI** (backend API proxy)
- **API key security:** Claude API key lives only in backend `.env` — never exposed to client
- **Hidden info security:** Enemy roles, hidden weapons, and the Phase-2 random role assignment MUST happen server-side and MUST NOT be sent to the frontend until they are legally revealed (duel outcome or match end). The backend is the source of truth for hidden state.
- **Deployment:** Runs locally on `localhost` for hackathon demo

---

## 9. Open Questions / Risks

- **Movement mechanics:** The board has a neutral zone (rows 3–4) which implies physical movement, but the current duel mechanic is "click-to-attack" with no movement required. **Decision needed:** for MVP, treat the grid as positional flavor only (no movement, any of your alive pieces can attack any of theirs), OR add Stratego-like movement (1 square per turn into an empty cell or onto an enemy to duel). **Recommended for MVP:** no movement — ship the core RPS+memory+roles loop first, add movement in v2.
- **AI move latency:** If Claude takes >3s per turn, the match feels sluggish. Mitigation: 3s timeout with random-valid-move fallback, plus a "thinking…" indicator.
- **AI memory across turns:** Claude is stateless per call. We pass full game history each turn — fine for 20 characters, but watch token usage.
- **Decoy balance:** "Decoy is invulnerable for the entire match" is a strong defensive piece. Playtest in week 2; if dominant, consider adding a cap (e.g., Decoy absorbs max 2 attacks before being removed). Tracked as a tunable.
- **Decoy stalemate edge case:** If the player's Flag is alive but the only remaining enemy character is the Decoy (which can't be killed), neither side can win. Decision needed before MVP — leaning toward: when only the Decoy remains, it becomes killable.
- **Reveal phase fairness:** 10 seconds for 20 characters is **tight**. With 10 per side, the player has roughly 1 second per enemy character to memorize. May need to extend to 15s after playtesting — flagged as the most likely tuning change.
- **Tie loop length:** Two evenly-matched players could in theory tie repeatedly. Soft cap (e.g., 5 ties → forced random resolution) to avoid infinite loops in the AI path.

---

## 10. Migration Note (from Memory Game)

This PRD replaces the original Memory Game PRD as of 2026-04-29. The following docs **still reference the old game** and need follow-up edits:
- `docs/ARCHITECTURE.md` — backend modules `cards/` and `hints/` need to become `squad/` and `ai-move/`; backend tech stack must change from Node.js/Express to **Python + FastAPI**
- `docs/DECISIONS.md` — record new decisions: Python/FastAPI backend (replacing Node), AI-opponent strategy, hidden-info enforcement, Decoy stalemate resolution, board layout (5×6, 10/side), movement mechanics decision
- `frontend/modules/game/`, `frontend/modules/theme-selector/`, `frontend/modules/hints/` — directory rename + logic rewrite (theme-selector goes away entirely)
- `backend/` — full rewrite from Node/Express to Python/FastAPI

These are tracked separately and not part of this PRD update.
