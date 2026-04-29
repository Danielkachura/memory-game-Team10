import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useGame } from "../../modules/game/src/hooks/useGame";

type TestWindow = Window & {
  __SQUAD_RPS_TEST__?: {
    finishReveal: () => Promise<void>;
    getState: () => unknown;
  };
};

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
    revealEndsAt: Date.now() / 1000 + 10,
    duel: null,
    result: null,
  };
}

describe("useGame", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes the reveal through the test helper", async () => {
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

    expect(result.current.match?.phase).toBe("reveal");

    const testWindow = window as TestWindow;
    await act(async () => {
      await testWindow.__SQUAD_RPS_TEST__?.finishReveal();
    });

    await waitFor(() => {
      expect(result.current.match?.phase).toBe("player_turn");
    });
  });
});
