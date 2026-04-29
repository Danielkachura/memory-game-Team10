import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGame } from "../../modules/game/src/hooks/useGame";

function revealMatch() {
  return {
    matchId: "reveal-1",
    phase: "reveal",
    currentTurn: "player",
    difficulty: "medium",
    message: "Memorize the enemy squad before the reveal timer ends.",
    board: [],
    stats: {
      durationSeconds: 0,
      playerDuelsWon: 0,
      playerDuelsLost: 0,
      tieSequences: 0,
      decoyAbsorbed: 0,
    },
    revealEndsAt: Date.now() / 1000 - 1,
    duel: null,
    result: null,
  };
}

describe("useGame", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("automatically completes the reveal when the timer expires", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => revealMatch(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...revealMatch(),
          phase: "player_turn",
          message: "Your turn. Pick an attacker and an enemy target.",
        }),
      } as Response);

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
    });

    await waitFor(() => {
      expect(result.current.match?.phase).toBe("player_turn");
    });
  });
});
