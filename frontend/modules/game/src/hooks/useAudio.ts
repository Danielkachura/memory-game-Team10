import { useCallback, useEffect, useRef } from "react";
import type { DuelSummary, Owner, Phase } from "./useGame";
import { audioManager } from "../utils/audioManager";

interface AudioGameState {
  phase: Phase;
  currentTurn: Owner | "none";
  duel: DuelSummary | null;
  result: { winner: Owner } | null;
  showDuel: boolean;
}

export function useAudio(state: AudioGameState | null) {
  const prevPhaseRef = useRef<Phase | null>(null);
  const prevTurnRef = useRef<Owner | "none" | null>(null);
  const prevResultRef = useRef<{ winner: Owner } | null>(null);
  const prevShowDuelRef = useRef(false);

  const handleGesture = useCallback(() => {
    audioManager.unlock();
  }, []);

  useEffect(() => {
    window.addEventListener("click", handleGesture, { once: true });
    window.addEventListener("keydown", handleGesture, { once: true });
    return () => {
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
    };
  }, [handleGesture]);

  useEffect(() => {
    if (!state) return;
    const { phase, currentTurn, duel, result, showDuel } = state;
    const prevPhase = prevPhaseRef.current;
    const prevTurn = prevTurnRef.current;
    const prevResult = prevResultRef.current;
    const prevShowDuel = prevShowDuelRef.current;

    if (prevPhase === null && phase === "reveal") {
      audioManager.playBgm();
      audioManager.play("shuffle");
    }

    if (prevTurn !== currentTurn && !showDuel) {
      if (currentTurn === "player") audioManager.play("red_turn");
      if (currentTurn === "ai") audioManager.play("blue_turn");
    }

    if (!prevShowDuel && showDuel && duel) {
      if (duel.tie) {
        audioManager.play("battle_start");
      } else {
        const winnerWeapon = duel.winner === "attacker" ? duel.attackerWeapon : duel.defenderWeapon;
        audioManager.playCombat(winnerWeapon);
      }
    }

    if (!prevResult && result) {
      audioManager.stopBgm();
      audioManager.play(result.winner === "player" ? "you_win" : "you_lose");
    }

    prevPhaseRef.current = phase;
    prevTurnRef.current = currentTurn;
    prevResultRef.current = result;
    prevShowDuelRef.current = showDuel;
  }, [state]);
}
