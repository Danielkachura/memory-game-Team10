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
- **Player 1 (Human):** Starts on **rows 1–2** (the bottom two rows).
- **AI (Player 2 / Claude):** Starts on **rows 5–6** (the top two rows).
- **Rows 3–4:** Neutral battle zone — empty at the start.
- **Team Size:** 10 characters per side — 20 total at match start.
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

Every character holds one weapon: 🪨 Rock, 📄 Paper, or ✂️ Scissors.

After the reveal, two characters per squad are secretly assigned special roles:
- 🚩 **Flag-bearer** — if defeated, that side **loses immediately**.
- 🎭 **Decoy** — invulnerable for the entire match. When attacked, the duel resolves normally but the Decoy never dies. Attackers still die if they lose the RPS battle against the Decoy.

The remaining 8 characters per squad are normal soldiers.

---

### Phase 1 — Weapon Reveal (10 seconds)

- All 20 characters are shown on the board, each holding their weapon forward so both sides can see it.
- A 10-second countdown is displayed.
- No roles are assigned yet. The board is locked — no actions possible.
- Players use this time to memorize who holds what on the enemy side.

### Phase 2 — Role Assignment & Hide

- At T=0, all characters bring their weapons behind their back (characters stay visible).
- The system randomly assigns 1 Flag-bearer + 1 Decoy per squad.
- **Asymmetric visibility:**
  - The player sees their own weapons + role markers. Enemy side: silhouettes only.
  - The AI sees its own weapons + roles. Player side: silhouettes only.
- Neither side ever sees the other's hidden state.

### Phase 3 — Duel Rounds (Turn Timer: 10 seconds)

Players take turns. **Each turn has a hard 10-second time limit enforced by the server.**

**On your turn:**
1. Select one of your alive characters → attacker.
2. Select an adjacent enemy character → target.
3. Both weapons are revealed for that duel only.
4. RPS resolution:
   - **Winner stays.** Weapon is hidden again after the duel.
   - **Loser is eliminated.** Role revealed at the moment of death.
   - **Tie:** both players pick a new weapon and re-duel (up to 5 times, then forced random resolution).
5. Special role outcomes:
   - **Flag-bearer killed** → that side loses immediately.
   - **Decoy attacked** → duel resolves normally, Decoy always survives. Attacker dies only if they lost RPS.
6. Turn passes to opponent.

**If the 10-second timer expires before a move is made:**
- The turn is forfeited automatically.
- The board passes to the opponent immediately.
- The event log records the timeout.
- The skipped player loses their action for that round — no penalty beyond losing the turn.

**Win conditions:**
1. Defeat the enemy Flag-bearer → instant win.
2. Lose your own Flag → instant loss.
3. Stalemate (only enemy Decoy remains) → Decoy becomes killable.

---

## 4. Core Features

| # | Feature | Description | Priority |
|---|---------|-------------|----------|
| 1 | 5×6 Board & Starting Positions | Render the grid; player on rows 1–2, AI on rows 5–6, rows 3–4 empty | Must Have |
| 2 | Weapon Reveal (Phase 1) | All 20 characters show weapons for 10 seconds with countdown | Must Have |
| 3 | Role Assignment (Phase 2) | After 10s, assign 1 Flag + 1 Decoy per squad; hide weapons | Must Have |
| 4 | Asymmetric Visibility | Each side sees only their own weapons + roles; enemy is silhouettes | Must Have |
| 5 | Duel Engine (RPS) | Click-to-attack, weapon reveal animation, RPS resolution, tie re-pick | Must Have |
| 6 | Flag & Decoy Rules | Flag death = instant loss; Decoy invulnerable all match | Must Have |
| 7 | Hidden-Info Enforcement | Winner's weapon hidden again after each duel | Must Have |
| 8 | AI-Generated Squads | Claude generates 20 characters with names + weapons each match | Must Have |
| 9 | AI Opponent (Claude plays) | Claude picks AI moves with memory-aware behavior | Must Have |
| 10 | **Turn Timer (10s)** | **Each player turn has exactly 10 seconds. Server enforces the limit. Timer expires → turn passes to opponent automatically.** | **Must Have** |
| 11 | Match Timer & Stats | Track match duration, duels won/lost, ties, timeouts | Must Have |
| 12 | Difficulty Levels | Easy / Medium / Hard — affects Claude's strategy | Nice to Have |

---

## 5. User Stories

### Story 1: The Reveal
> As a player, I want to see all 20 characters with their weapons for 10 seconds, so I can memorize the enemy lineup.

**Acceptance Criteria:**
- [ ] 5×6 board renders with 10 player chars on rows 1–2, 10 AI chars on rows 5–6
- [ ] All 20 characters show weapon icons clearly
- [ ] 10-second countdown shown prominently
- [ ] Board locked during reveal — no actions possible
- [ ] At T=0, weapons hide simultaneously; roles assigned
- [ ] Player sees own weapons + role markers; enemy = silhouettes
- [ ] "Your turn" prompt appears when ready

### Story 2: Attacking with a Character
> As a player, I want to pick one of my characters and attack an enemy, making progress toward finding their Flag.

**Acceptance Criteria:**
- [ ] On my turn, I can select one of my alive characters
- [ ] Selected attacker is visually highlighted
- [ ] I can click an adjacent enemy character to trigger a duel
- [ ] Duel animation plays: both weapons revealed for this duel only
- [ ] RPS resolves and outcome is shown clearly
- [ ] On tie: both players choose new weapon and re-duel (up to 5 times)
- [ ] Losing character disappears; winner's weapon hides again
- [ ] Flag death → match-end screen
- [ ] Decoy attack → Decoy stays, attacker may die if they lost RPS
- [ ] Turn passes to opponent

### Story 3: Turn Timer
> As a player, I want to see how much time I have left to act, so I know when my turn will expire.

**Acceptance Criteria:**
- [ ] A visible countdown (10 → 0 seconds) appears at the start of every player turn
- [ ] The countdown uses the server's `turnEndsAt` timestamp — it is accurate even on slow connections
- [ ] At T=3, the timer turns red and pulses urgently
- [ ] When the timer reaches 0 and no action was taken, the server automatically skips the turn
- [ ] The next GET /api/match/{id} call returns the updated phase with the new current player
- [ ] The event log shows: "Turn timeout: [player] did not act within 10s. Turn passes to [opponent]."
- [ ] The skipped player sees a clear "Time's up!" message
- [ ] In PVP: the opponent's client picks up the skip via polling within 1.5 seconds
- [ ] The timer does NOT apply during the reveal phase or the finished phase
- [ ] The timer resets to 10 seconds at the start of every new turn (after each move, attack, or tie resolution)
- [ ] In VS-AI mode: the AI turn also has a 10-second window; if Claude doesn't respond in time, the fallback random move fires and the timer resets normally

### Story 4: AI-Generated Squads
> As a player, I want a freshly-generated squad each match.

**Acceptance Criteria:**
- [ ] On match start, Claude generates 2 squads × 10 characters each with name, weapon, description
- [ ] Roles assigned server-side after Phase 1 — never sent to client early
- [ ] Balanced weapons (≥2 of each type per squad)
- [ ] Loading state shown during generation
- [ ] Fallback to built-in roster if API fails

### Story 5: AI Opponent Plays
> As a player, I want Claude to play as my opponent — making moves that feel like a real player.

**Acceptance Criteria:**
- [ ] On AI turn, backend calls Claude with only what AI is allowed to see
- [ ] AI returns a move within 3 seconds (timeout → random valid fallback)
- [ ] AI never receives player's hidden roles or weapons — server-enforced
- [ ] AI behavior scales with difficulty
- [ ] AI also has a 10-second turn timer; the random fallback fires before the timer expires

### Story 6: Match End & Stats
> As a player, I want to see the result and a stat summary at the end.

**Acceptance Criteria:**
- [ ] Result screen shows Win / Loss + reason
- [ ] Stats: match duration, duels won, duels lost, tie sequences, Decoy absorbs, turns timed out
- [ ] "Play Again" button starts a new match
- [ ] All enemy roles and weapons revealed at match end

---

## 6. Out of Scope

- Online multiplayer via WebSockets
- Hot-seat 2-player on same device
- User accounts, persistent stats
- Mobile native app
- Custom squad sizes, role mixes, or board sizes
- Movement mechanics (MVP: direct adjacent attack)

---

## 7. Success Criteria

- [ ] Full match playable start to finish without errors
- [ ] Turn timer visible and accurate every turn
- [ ] Turn skips correctly when timer expires — server-enforced, not client-side
- [ ] Board renders 5×6 correctly
- [ ] AI-generated squads load with valid weapon distribution
- [ ] AI makes legal moves every turn, handles ties, respects timer
- [ ] Asymmetric visibility: client never receives enemy hidden state
- [ ] Flag mechanic: instant win/loss on Flag death
- [ ] Decoy mechanic: Decoy survives every attack (unless stalemate)
- [ ] Tie mechanic: re-pick up to 5 times then forced resolution
- [ ] Game playable in Chrome/Firefox
- [ ] No API keys in frontend code

---

## 8. Technical Constraints

- **Must use:** Claude API (`claude-sonnet-4-20250514`) for squad generation + AI moves
- **Stack:** React + TypeScript (frontend), Python + FastAPI (backend)
- **Turn timer:** Server-authoritative. `turn_ends_at` is a Unix timestamp stored in match state. The frontend displays it as a countdown. The server enforces the skip on any action request or GET after expiry.
- **Turn duration:** `TURN_SECONDS = 10` constant in `app.py`. Tunable without PRD change.
- **API key security:** Claude API key in backend `.env` only — never in frontend
- **Hidden info:** All hidden state server-side only. Client receives filtered view.
- **Deployment:** localhost for hackathon demo

---

## 9. Open Questions / Risks

- **Turn timer UX:** 10 seconds may feel short for new players. If playtesting shows consistent timeouts, increase `TURN_SECONDS` to 15 in `app.py` — no other change needed.
- **Repick timer:** Each repick in a tie also gets 10 seconds. If both players are slow, a 5-tie sequence could consume 50+ seconds. Mitigated by the 5-tie forced resolution cap.
- **AI turn timer:** The AI's 3-second Claude timeout fires well within the 10-second turn window. The AI will never actually time out from the turn timer under normal conditions.
- **Movement mechanics:** Board has a neutral zone implying movement, but MVP uses direct adjacent attack. Movement in v2.
- **Decoy stalemate:** If only the enemy Decoy remains, it becomes killable to prevent a draw.
- **Reveal phase fairness:** 10 seconds for 20 characters is tight. May extend to 15s after playtesting.

---

## 10. Migration Note (from Memory Game)

This PRD replaces the original Memory Game PRD as of 2026-04-29.
