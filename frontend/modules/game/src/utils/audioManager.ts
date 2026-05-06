type SfxKey =
  | "shuffle"
  | "blue_turn"
  | "red_turn"
  | "battle_start"
  | "rock"
  | "paper"
  | "scissors"
  | "you_win"
  | "you_lose"
  | "jump";

const SFX_PATHS: Record<SfxKey, string> = {
  shuffle:      "/audio/shuffle.wav.mp4",
  blue_turn:    "/audio/blue_turn.wav.mp4",
  red_turn:     "/audio/red_turn.wav.mp4",
  battle_start: "/audio/battle_start.wav.m4a",
  rock:         "/audio/rock.wav.mp4",
  paper:        "/audio/paper.wav.mp4",
  scissors:     "/audio/scissors.wav.mp4",
  you_win:      "/audio/you_win.wav.mp4",
  you_lose:     "/audio/you_lose.wav.mp4",
  jump:         "/audio/jump.wav.mp4",
};

const BGM_PATH       = "/audio/main_theme.wav.mp4";
const BGM_NORMAL_VOL = 0.38;
const BGM_DUCKED_VOL = 0.06;
const FADE_IN_MS     = 900;   // fade-in on page load
const DUCK_MS        = 160;   // how fast BGM dips when SFX starts
const UNDUCK_MS      = 380;   // how fast BGM recovers after SFX ends
const STOP_FADE_MS   = 1000;  // fade-out on game over

export const JUMP_DURATION_MS = 500;

class AudioManager {
  private bgm:             HTMLAudioElement | null = null;
  private sfx:             Partial<Record<SfxKey, HTMLAudioElement>> = {};
  private enabled          = true;
  private unlocked         = false;
  private bgmShouldPlay    = false;
  private activeSfx        = 0;
  private fadeTimer:       number | null = null;
  private stopFadeTimer:   ReturnType<typeof setTimeout> | null = null;

  // ── Unlock (first user gesture) ─────────────────────────────────
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;

    this.bgm        = new Audio(BGM_PATH);
    this.bgm.loop   = true;
    this.bgm.volume = 0;
    this.bgmShouldPlay = true;
    void this.bgm.play().catch(() => {});
    this._fadeTo(BGM_NORMAL_VOL, FADE_IN_MS);   // gentle fade-in from silence

    for (const [key, path] of Object.entries(SFX_PATHS) as [SfxKey, string][]) {
      const el    = new Audio(path);
      el.preload  = "auto";
      el.volume   = 0.82;
      this.sfx[key] = el;
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stopBgm();
  }

  // ── BGM controls ────────────────────────────────────────────────
  /** Restart BGM (e.g. new match after game-over). No-op if already playing. */
  playBgm() {
    if (!this.enabled || !this.bgm) return;
    this.bgmShouldPlay = true;
    if (this.bgm.paused && this.activeSfx === 0) {
      this.bgm.currentTime = 0;
      void this.bgm.play().catch(() => {});
      this._fadeTo(BGM_NORMAL_VOL, FADE_IN_MS);
    }
  }

  /** Fade out then stop (game over). */
  stopBgm() {
    this.bgmShouldPlay = false;
    this._fadeTo(0, STOP_FADE_MS);
    if (this.stopFadeTimer) clearTimeout(this.stopFadeTimer);
    this.stopFadeTimer = setTimeout(() => {
      if (!this.bgmShouldPlay) this.bgm?.pause();
    }, STOP_FADE_MS + 50);
  }

  // ── SFX — duck BGM, restore when done ───────────────────────────
  play(key: SfxKey) {
    if (!this.enabled) return;
    const el = this.sfx[key];
    if (!el) return;

    this.activeSfx++;
    // Duck — only if BGM is audibly running
    if (this.bgm && !this.bgm.paused && this.bgm.volume > BGM_DUCKED_VOL) {
      this._fadeTo(BGM_DUCKED_VOL, DUCK_MS);
    }

    el.currentTime = 0;

    const onEnd = () => {
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onEnd);
      this.activeSfx = Math.max(0, this.activeSfx - 1);
      // Restore only when every SFX has finished
      if (this.activeSfx === 0 && this.bgmShouldPlay && this.bgm && !this.bgm.paused) {
        this._fadeTo(BGM_NORMAL_VOL, UNDUCK_MS);
      }
    };

    el.addEventListener("ended", onEnd, { once: true });
    el.addEventListener("error", onEnd, { once: true });
    void el.play().catch(() => { onEnd(); });
  }

  playJump(): number {
    this.play("jump");
    return JUMP_DURATION_MS;
  }

  /**
   * Full combat sequence:
   *   t=0    → battle_start  (Jan-Ken-Pon call)
   *   t=1000 → winning weapon sound (rock / paper / scissors)
   *
   * Tie case is handled in useAudio (plays battle_start again on repick).
   */
  playCombat(winnerWeapon: "rock" | "paper" | "scissors") {
    this.play("battle_start");
    window.setTimeout(() => this.play(winnerWeapon), 1000);
  }

  // ── Volume fade engine (~60 fps) ────────────────────────────────
  private _fadeTo(target: number, ms: number) {
    if (!this.bgm) return;
    if (this.fadeTimer !== null) clearInterval(this.fadeTimer);

    const start  = this.bgm.volume;
    const delta  = target - start;
    const steps  = Math.max(1, Math.round(ms / 16));
    let   i      = 0;

    this.fadeTimer = window.setInterval(() => {
      if (!this.bgm) { clearInterval(this.fadeTimer!); return; }
      i++;
      const t = i / steps;
      // ease-out curve: smoother than linear
      this.bgm.volume = Math.min(1, Math.max(0, start + delta * (1 - Math.pow(1 - t, 2))));
      if (i >= steps) {
        this.bgm.volume = target;
        clearInterval(this.fadeTimer!);
        this.fadeTimer = null;
      }
    }, 16);
  }
}

export const audioManager = new AudioManager();
