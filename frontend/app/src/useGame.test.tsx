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

  it("returns local action feedback for blocked attacks", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matchId: "match-1",
        phase: "player_turn",
        currentTurn: "player",
        difficulty: "medium",
        message: "Your turn. Pick an attacker and an enemy target.",
        board: [
          {
            id: "player-1",
            owner: "player",
            row: 2,
            col: 3,
            alive: true,
            label: "Paper",
            weapon: "paper",
            weaponIcon: "P",
            role: "soldier",
            roleIcon: null,
            silhouette: false,
          },
          {
            id: "ai-1",
            owner: "ai",
            row: 5,
            col: 3,
            alive: true,
            label: "Hidden Operative",
            weapon: null,
            weaponIcon: null,
            role: null,
            roleIcon: null,
            silhouette: true,
          },
        ],
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
      }),
    } as Response);

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
    });

    await act(async () => {
      result.current.onPieceClick(result.current.match!.board[0]);
    });

    await act(async () => {
      result.current.onPieceClick(result.current.match!.board[1]);
    });

    expect(result.current.actionFeedback?.message).toMatch(/blocked: you can only duel an adjacent enemy target/i);
  });
});
