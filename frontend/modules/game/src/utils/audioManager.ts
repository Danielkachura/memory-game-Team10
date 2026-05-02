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
  shuffle: "/audio/shuffle.wav.mp4",
  blue_turn: "/audio/blue_turn.wav.mp4",
  red_turn: "/audio/red_turn.wav.mp4",
  battle_start: "/audio/battle_start.wav.m4a",
  rock: "/audio/rock.wav.mp4",
  paper: "/audio/paper.wav.mp4",
  scissors: "/audio/scissors.wav.mp4",
  you_win: "/audio/you_win.wav.mp4",
  you_lose: "/audio/you_lose.wav.mp4",
  jump: "/audio/jump.wav.mp4",
};

const BGM_PATH = "/audio/main_theme.wav.mp4";
const BGM_NORMAL_VOL = 0.38;
const BGM_DUCKED_VOL = 0.06;
const FADE_IN_MS = 900;
const DUCK_MS = 160;
const UNDUCK_MS = 380;
const STOP_FADE_MS = 1000;
const AUDIO_MODE_STORAGE_KEY = "squad-rps-audio-mode";

export const JUMP_DURATION_MS = 500;
export type AudioMode = "all" | "sfx" | "muted";

function isJsdomAudioEnv() {
  return typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);
}

function readStoredAudioMode(): AudioMode {
  if (typeof window === "undefined") {
    return "all";
  }
  const stored = window.localStorage.getItem(AUDIO_MODE_STORAGE_KEY);
  return stored === "sfx" || stored === "muted" ? stored : "all";
}

class AudioManager {
  private bgm: HTMLAudioElement | null = null;
  private sfx: Partial<Record<SfxKey, HTMLAudioElement>> = {};
  private mode: AudioMode = readStoredAudioMode();
  private unlocked = false;
  private bgmShouldPlay = false;
  private activeSfx = 0;
  private fadeTimer: number | null = null;
  private stopFadeTimer: ReturnType<typeof setTimeout> | null = null;

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;

    this.bgm = new Audio(BGM_PATH);
    this.bgm.loop = true;
    this.bgm.volume = 0;
    this.bgmShouldPlay = true;
    if (this.isMusicEnabled()) {
      this.tryPlay(this.bgm);
      this.fadeTo(BGM_NORMAL_VOL, FADE_IN_MS);
    }

    for (const [key, path] of Object.entries(SFX_PATHS) as [SfxKey, string][]) {
      const el = new Audio(path);
      el.preload = "auto";
      el.volume = 0.82;
      this.sfx[key] = el;
    }
  }

  getMode() {
    return this.mode;
  }

  setMode(mode: AudioMode) {
    this.mode = mode;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUDIO_MODE_STORAGE_KEY, mode);
    }

    if (!this.bgm) {
      return;
    }

    if (!this.isMusicEnabled()) {
      this.bgm.pause();
      this.bgm.volume = 0;
      return;
    }

    if (this.bgmShouldPlay) {
      this.tryPlay(this.bgm);
      this.fadeTo(this.activeSfx > 0 ? BGM_DUCKED_VOL : BGM_NORMAL_VOL, FADE_IN_MS);
    }
  }

  playBgm() {
    if (!this.bgm || !this.isMusicEnabled()) return;
    this.bgmShouldPlay = true;
    if (this.bgm.paused && this.activeSfx === 0) {
      this.bgm.currentTime = 0;
      this.tryPlay(this.bgm);
      this.fadeTo(BGM_NORMAL_VOL, FADE_IN_MS);
    }
  }

  stopBgm() {
    this.bgmShouldPlay = false;
    this.fadeTo(0, STOP_FADE_MS);
    if (this.stopFadeTimer) clearTimeout(this.stopFadeTimer);
    this.stopFadeTimer = setTimeout(() => {
      if (!this.bgmShouldPlay) this.bgm?.pause();
    }, STOP_FADE_MS + 50);
  }

  play(key: SfxKey) {
    if (!this.isSfxEnabled()) return;
    const el = this.sfx[key];
    if (!el || isJsdomAudioEnv()) return;

    this.activeSfx++;
    if (this.bgm && !this.bgm.paused && this.bgm.volume > BGM_DUCKED_VOL) {
      this.fadeTo(BGM_DUCKED_VOL, DUCK_MS);
    }

    el.currentTime = 0;

    const onEnd = () => {
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onEnd);
      this.activeSfx = Math.max(0, this.activeSfx - 1);
      if (this.activeSfx === 0 && this.bgmShouldPlay && this.bgm && !this.bgm.paused) {
        this.fadeTo(BGM_NORMAL_VOL, UNDUCK_MS);
      }
    };

    el.addEventListener("ended", onEnd, { once: true });
    el.addEventListener("error", onEnd, { once: true });
    try {
      const playResult = el.play();
      if (playResult && typeof playResult.catch === "function") {
        void playResult.catch(() => {
          onEnd();
        });
      }
    } catch {
      onEnd();
    }
  }

  playJump(): number {
    this.play("jump");
    return JUMP_DURATION_MS;
  }

  playCombat(winnerWeapon: "rock" | "paper" | "scissors") {
    this.play("battle_start");
    window.setTimeout(() => this.play(winnerWeapon), 1000);
  }

  private fadeTo(target: number, ms: number) {
    if (!this.bgm) return;
    if (this.fadeTimer !== null) clearInterval(this.fadeTimer);

    const start = this.bgm.volume;
    const delta = target - start;
    const steps = Math.max(1, Math.round(ms / 16));
    let step = 0;

    this.fadeTimer = window.setInterval(() => {
      if (!this.bgm) {
        if (this.fadeTimer !== null) clearInterval(this.fadeTimer);
        return;
      }
      step += 1;
      const progress = step / steps;
      this.bgm.volume = Math.min(1, Math.max(0, start + delta * (1 - Math.pow(1 - progress, 2))));
      if (step >= steps) {
        this.bgm.volume = target;
        if (this.fadeTimer !== null) clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, 16);
  }

  private tryPlay(audio: HTMLAudioElement) {
    if (isJsdomAudioEnv()) return;
    try {
      const playResult = audio.play();
      if (playResult && typeof playResult.catch === "function") {
        void playResult.catch(() => {});
      }
    } catch {
      // Ignore local test-time failures.
    }
  }

  private isMusicEnabled() {
    return this.mode === "all";
  }

  private isSfxEnabled() {
    return this.mode === "all" || this.mode === "sfx";
  }
}

export const audioManager = new AudioManager();
