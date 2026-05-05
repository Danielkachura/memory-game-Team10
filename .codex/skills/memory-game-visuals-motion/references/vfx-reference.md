# VFX Reference — Squad RPS

## ICQ RPS Beat Map (master reference)

```
T+0ms    wind-up pose appears (character_*_kick_nobg.png)
T+300ms  weapon THROW — image flies in + sound fires
T+450ms  winner flash gold / loser shrinks grey
T+700ms  character reaction: winner jumps, loser slumps, tie shrugs
T+1000ms board resets — player can act again
```

---

## Audio Trigger Map

| Event | File | Volume | Offset |
|-------|------|--------|--------|
| Duel opens | `battle_start.wav.m4a` | 0.7 | T+0ms |
| Rock revealed | `rock.wav.mp4` | 0.8 | T+300ms |
| Paper revealed | `paper.wav.mp4` | 0.8 | T+300ms |
| Scissors revealed | `scissors.wav.mp4` | 0.8 | T+300ms |
| Defender weapon | same as above | 0.6 | T+350ms |
| Player wins duel | `jump.wav.mp4` | 0.75 | T+450ms |
| Tie / Decoy | `shuffle.wav.mp4` | 0.7 | T+0ms |
| Piece selected | `select_click.wav.mp4` | 0.4 | immediate |
| Piece moves | `jump.wav.mp4` | 0.6 | on move start |
| Player turn | `red_turn.wav.mp4` | 0.5 | on phase change |
| AI turn | `blue_turn.wav.mp4` | 0.5 | on phase change |
| Victory | `you_win.wav.mp4` | 0.9 | on result |
| Defeat | `you_lose.wav.mp4` | 0.9 | on result |
| Music | `main_theme.wav.mp4` | 0.2 | loop, match start |

---

## Image → State Map

| State | Player image | AI image |
|-------|-------------|---------|
| Idle | `character_red_idle_nobg.png` | `character_blue_idle_nobg.png` |
| Wind-up | `character_red_kick_nobg.png` | `character_blue_kick_nobg.png` |
| Rock throw | `character_red_rock_nobg.png` | `rock_nobg.png` |
| Paper throw | `character_red_paper_nobg.png` | `paper_flat_nobg.png` |
| Scissors throw | `character_red_scissors_nobg.png` | `character_blue_scissors_nobg.png` |
| Win reaction | `character_red_trophy_nobg.png` | `hero_blue_jump_sprites.jpg` |
| Death | `character_yellow_fallen_nobg.png` | `character_yellow_fallen_nobg.png` |
| Hidden silhouette | — | `character_blue_front_nobg.png` |
| Flag-bearer | `character_red_flag_nobg.png` | `character_blue_flag_nobg.png` |

---

## Timing Scale

| Name | Duration | Use for |
|------|----------|---------|
| instant | 0–80ms | hover, press, color change |
| fast | 150–180ms | selection, glow |
| standard | 250–300ms | movement, panel slide |
| dramatic | 350–500ms | death, duel reveal |
| cinematic | 600–900ms | flag death ONLY |
| NEVER | >900ms | anything |

---

## Easing Vocabulary

| Feel | Value | Use for |
|------|-------|---------|
| Bounce select | `cubic-bezier(0.34, 1.56, 0.64, 1)` | selection, weapon reveal |
| Sharp impact | `cubic-bezier(0.22, 1, 0.36, 1)` | duel hit, winner flash |
| Smooth land | `ease-out` | movement landing |
| Soft fade | `ease-in-out` | reveal hide, board dim |

---

## prefers-reduced-motion Template

```css
@media (prefers-reduced-motion: reduce) {
  .your-animation-class {
    animation: none !important;
    transition: none !important;
  }
}
```

Every animation class needs this. No exceptions.

---

## Known Bug to Fix First

```ts
// UnitSprite.tsx PLAYER_IMG — scissors is wrong:
scissors: "/logo_rps_online_nobg.png",   // ← WRONG

// Fix to:
scissors: "/character_red_scissors_nobg.png",  // ← CORRECT (file exists)
```

---

## New Sound File (not in old project)

`/audio/select_click.wav.mp4` — 0.22s, 4KB
Play on own piece selection. Implement directly in `onPieceClick` in `useGame.ts`:
```ts
new Audio("/audio/select_click.wav.mp4").play().catch(() => {});
```
