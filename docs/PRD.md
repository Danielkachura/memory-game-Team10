# Squad RPS – Game Rules (PRD)

**Team 10 | AIcademy Hackathon 2026**  
**Last Updated:** 2026-05-04

---

## 🧠 Overview

A strategy board game on a 5×6 grid, based on memory, movement, and Rock–Paper–Scissors combat.

**Game modes:**
* Player vs AI
* Player vs Player

**Goal:** Find and eliminate the opponent's Flag.

---

## 🗺️ Board

* **Board size:** 5×6 (30 tiles)
* **Each side starts with 10 characters**
* **Player starts on the bottom two rows**
* **Opponent starts on the top two rows**
* **Battles can occur on any tile that contains an enemy**

```
Row 6 │ AI    AI    AI    AI    AI     ← Opponent back row
Row 5 │ AI    AI    AI    AI    AI     ← Opponent front row
Row 4 │ ·     ·     ·     ·     ·      ← Battle zone
Row 3 │ ·     ·     ·     ·     ·      ← Battle zone
Row 2 │ P1    P1    P1    P1    P1     ← Player front row
Row 1 │ P1    P1    P1    P1    P1     ← Player back row
        Col1  Col2  Col3  Col4  Col5
```

---

## 🎮 Game Modes

### 👤 Player vs AI
The player competes against a computer opponent.

### 👥 Player vs Player
Two players compete against each other.

**Each player sees only:**
* Their own characters
* Their own weapons
* Their own Flag and Decoy

**The opponent cannot see your selections.**

---

## ⚔️ Game Phases

### 🔍 Phase 1 — Weapon Reveal (10 seconds)

**At the start of the game:**
* All characters are visible on the board
* All weapons are visible to both players
* No movement allowed
* No combat

⏱️ **Duration:** 10 seconds  
🎯 **Goal:** Memorize the opponent's weapons

---

### 🙈 Phase 2 — Hide Weapons

**After 10 seconds:**
* The opponent's weapons are hidden
* The opponent's characters remain visible without weapons
* Characters themselves are NOT hidden

❗ **Important:**
* No silhouettes
* No full concealment
* Only the weapon is hidden

**The player still sees:**
* Their own characters
* Their own weapons

---

### 🎭 Phase 3 — Role Selection

**Each player selects:**
* 🚩 One character as Flag
* 🎭 One character as Decoy

❗ **The opponent cannot see these selections.**

---

## 🎭 Character Types

### 🧍 Regular Character
* Holds one weapon:
  * Rock
  * Paper
  * Scissors
* Can move and fight

### 🚩 Flag
* Can move normally
* Has no visible marker to the opponent
* **If killed → immediate loss**

### 🎭 Decoy
* Can move normally

**Special Rule — If attacked:**
* ❌ Attacker dies immediately
* ✅ Decoy remains on the board
* ❌ No RPS combat occurs

---

## 🚶‍♂️ Movement

**Each turn:**
1. Select one of your characters
2. Move it one tile

**Possible directions:**
* Up
* Down
* Left
* Right

❗ **No diagonal movement**

### Movement Conditions

**A move is allowed if:**
* The tile is inside the board
* The tile is empty

**If the tile contains an enemy:**  
👉 Selecting it triggers a battle

---

## 🥊 Combat

Combat occurs when a character moves into a tile occupied by an enemy.

### ✂️ Rock–Paper–Scissors Rules
* **Rock beats Scissors**
* **Scissors beats Paper**
* **Paper beats Rock**

### 🟢 Normal Outcome
* The loser is removed from the board
* The winner remains
* If the attacker wins → moves into the tile
* If the defender wins → stays in place

### 🔁 Tie
**If there is a tie:**
* The battle continues
* Both players choose new weapons
* The battle repeats until there is a winner

❗ **Important:**  
The newly chosen weapon remains with the character for the rest of the game

---

## 🎭 Special Combat Rules

### Decoy
**If a Decoy is attacked:**
* The attacker dies immediately
* The Decoy survives
* No standard combat occurs

### Flag
**If the Flag is killed:**
* The game ends immediately
* That player loses

---

## 👁️‍🗨️ Visibility Rules

### During Reveal Phase
✅ All weapons are visible

### After Reveal

**Opponent appears:**
* As a normal character
* Without weapon
* Without role indicators

**Player sees:**
* Their own weapons
* Their own roles

---

## 🎨 Visual Design

* **Characters are always visible** (no silhouettes)
* **Characters themselves are never hidden**
* **Only weapons are hidden** after the reveal phase
* **Visual style should match the reference video:**
  * During reveal → characters with weapons
  * After reveal → same characters without weapons

---

## 🏆 Win Conditions

### A player wins if:
✅ They eliminate the opponent's Flag

### A player loses if:
❌ Their own Flag is eliminated

---

## 📋 Technical Notes

**Tech Stack:**
* Frontend: React + TypeScript + Vite
* Backend: Python + FastAPI
* AI: Claude API (`claude-sonnet-4-20250514`)
* Testing: Vitest + pytest + Playwright

**Deployment:**
* Localhost (hackathon demo)

**Security:**
* API key in backend `.env` only
* Hidden info enforced server-side
* Client receives filtered view only

---

**Document Version:** 3.0 (Simplified)  
**Last Updated:** 2026-05-04
