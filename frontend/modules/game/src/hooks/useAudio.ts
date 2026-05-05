import { useEffect, useRef } from "react";
import type { Phase } from "./useGame";

type AudioState = {
  phase: Phase;
  currentTurn: "player" | "ai" | "none";
  duel: {
    attackerWeapon?: string;
    defenderWeapon?: string;
    winner?: string;
    tie?: boolean;
    attackerId?: string;
  } | null;
  result: { winner?: string } | null;
  showDuel: boolean;
  revealSecondsLeft?: number;
};

export function useAudio(state: AudioState | null) {
  const lastRef = useRef<string>("");
  const lastTickRef = useRef<number | null>(null);

  function playSound(filename: string, volume = 0.7) {
    const audio = new Audio(`/audio/${filename}`);
    audio.volume = volume;
    if (navigator.userAgent.includes("jsdom") && audio instanceof HTMLAudioElement) {
      return;
    }
    try {
      const playback = audio.play?.();
      if (playback && typeof playback.catch === "function") {
        playback.catch(() => {});
      }
    } catch {
      // jsdom and restricted browsers can reject media playback synchronously.
    }
  }

  function playTone(frequency: number, durationMs: number) {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    window.setTimeout(() => {
      oscillator.stop();
      context.close().catch(() => {});
    }, durationMs);
  }

  useEffect(() => {
    if (typeof window === "undefined" || !state) {
      return;
    }

    const signature = [
      state.phase,
      state.currentTurn,
      state.showDuel ? "duel" : "no-duel",
      state.duel?.attackerWeapon ?? "no-attacker-weapon",
      state.duel?.defenderWeapon ?? "no-defender-weapon",
      state.duel?.winner ?? "no-duel-winner",
      state.duel?.tie ? "tie" : "not-tie",
      state.result?.winner ?? "no-result",
      state.revealSecondsLeft ?? "no-reveal-timer",
    ].join("|");

    if (signature === lastRef.current) {
      return;
    }
    lastRef.current = signature;

    const preferences = window.localStorage.getItem("squad-rps-audio-mode") ?? "all";
    if (preferences === "nothing") {
      return;
    }

    if (state.phase === "player_turn" && state.currentTurn === "player") {
      playSound("red_turn.wav.mp4", 0.5);
    }
    if (state.phase === "ai_turn") {
      playSound("blue_turn.wav.mp4", 0.5);
    }
    if (
      state.phase === "reveal" &&
      typeof state.revealSecondsLeft === "number" &&
      state.revealSecondsLeft <= 3 &&
      state.revealSecondsLeft > 0 &&
      lastTickRef.current !== state.revealSecondsLeft
    ) {
      lastTickRef.current = state.revealSecondsLeft;
      playTone(600, 80);
    }
    if (state.showDuel && state.duel) {
      playSound("battle_start.wav.m4a", 0.7);
    }
    if (state.showDuel && state.duel?.attackerWeapon) {
      const timers: ReturnType<typeof window.setTimeout>[] = [];
      timers.push(window.setTimeout(() => {
        const attackerWeapon = state.duel?.attackerWeapon;
        const defenderWeapon = state.duel?.defenderWeapon;
        if (attackerWeapon === "rock") playSound("rock.wav.mp4", 0.8);
        if (attackerWeapon === "paper") playSound("paper.wav.mp4", 0.8);
        if (attackerWeapon === "scissors") playSound("scissors.wav.mp4", 0.8);

        timers.push(window.setTimeout(() => {
          if (defenderWeapon === "rock") playSound("rock.wav.mp4", 0.6);
          if (defenderWeapon === "paper") playSound("paper.wav.mp4", 0.6);
          if (defenderWeapon === "scissors") playSound("scissors.wav.mp4", 0.6);
        }, 50));
      }, 300));

      if (state.duel.winner === "attacker" && state.duel.attackerId?.startsWith("player")) {
        timers.push(window.setTimeout(() => playSound("jump.wav.mp4", 0.8), 450));
      }

      if (state.duel.tie) {
        playSound("shuffle.wav.mp4", 0.7);
      }

      return () => {
        for (const timer of timers) {
          window.clearTimeout(timer);
        }
      };
    }
    if (state.result?.winner === "player") {
      playSound("you_win.wav.mp4", 0.9);
    }
    if (state.result?.winner === "ai") {
      playSound("you_lose.wav.mp4", 0.9);
    }
  }, [state]);
}
