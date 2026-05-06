import { useEffect, useRef, useCallback } from "react";
import { Phase, Owner, DuelSummary } from "@shared/types";
import { audioManager } from "../utils/audioManager";

interface AudioGameState {
  phase:       Phase;
  currentTurn: Owner | "none";
  duel:        DuelSummary | null;
  result:      { winner: Owner } | null;
  showDuel:    boolean;
}

export function useAudio(state: AudioGameState | null) {
  const prevPhaseRef    = useRef<Phase | null>(null);
  const prevTurnRef     = useRef<Owner | "none" | null>(null);
  const prevResultRef   = useRef<{ winner: Owner } | null>(null);
  const prevShowDuelRef = useRef<boolean>(false);

  // ── Unlock + start BGM on first user gesture ───────────────────
  const handleGesture = useCallback(() => {
    audioManager.unlock();
  }, []);

  useEffect(() => {
    window.addEventListener("click",   handleGesture, { once: true });
    window.addEventListener("keydown", handleGesture, { once: true });
    return () => {
      window.removeEventListener("click",   handleGesture);
      window.removeEventListener("keydown", handleGesture);
    };
  }, [handleGesture]);

  // ── React to game state ─────────────────────────────────────────
  useEffect(() => {
    if (!state) return;
    const { phase, currentTurn, duel, result, showDuel } = state;
    const prevPhase    = prevPhaseRef.current;
    const prevTurn     = prevTurnRef.current;
    const prevResult   = prevResultRef.current;
    const prevShowDuel = prevShowDuelRef.current;

    // New match start — restart BGM (in case it was stopped after game-over) + shuffle
    if (prevPhase === null && phase === "reveal") {
      audioManager.playBgm();
      audioManager.play("shuffle");
    }

    // Turn announcement — skip during active duel
    if (prevTurn !== currentTurn && !showDuel) {
      if (currentTurn === "player") audioManager.play("red_turn");
      if (currentTurn === "ai")     audioManager.play("blue_turn");
    }

    // Combat sequence — duel overlay just opened
    if (!prevShowDuel && showDuel && duel) {
      if (duel.tie) {
        // Tie: just play Jan-Ken-Pon again
        audioManager.play("battle_start");
      } else {
        // Non-tie: full sequence
        //   t=0    → battle_start (Jan-Ken-Pon)
        //   t=1000 → winning weapon sound
        const winnerWeapon = duel.winner === "attacker"
          ? duel.attackerWeapon
          : duel.defenderWeapon;
        audioManager.playCombat(winnerWeapon);
      }
    }

    // Game over — fade out BGM, then play outcome
    if (!prevResult && result) {
      audioManager.stopBgm();
      audioManager.play(result.winner === "player" ? "you_win" : "you_lose");
    }

    prevPhaseRef.current    = phase;
    prevTurnRef.current     = currentTurn;
    prevResultRef.current   = result;
    prevShowDuelRef.current = showDuel;
  });
}
