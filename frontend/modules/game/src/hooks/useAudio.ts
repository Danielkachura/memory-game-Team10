import { useEffect, useRef } from "react";
import type { Phase } from "./useGame";

type AudioState = {
  phase: Phase;
  currentTurn: "player" | "ai" | "none";
  duel: unknown;
  result: unknown;
  showDuel: boolean;
};

export function useAudio(state: AudioState | null) {
  const lastRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined" || !state) {
      return;
    }

    const signature = [
      state.phase,
      state.currentTurn,
      state.showDuel ? "duel" : "no-duel",
      state.duel ? "duel-present" : "no-duel-data",
      state.result ? "result-present" : "no-result",
    ].join("|");

    if (signature === lastRef.current) {
      return;
    }
    lastRef.current = signature;

    const preferences = window.localStorage.getItem("squad-rps-audio-mode") ?? "all";
    if (preferences === "nothing") {
      return;
    }
  }, [state]);
}
