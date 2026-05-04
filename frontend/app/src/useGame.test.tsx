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

  it("completes an already-expired reveal match after refresh", async () => {
    const expiredReveal = {
      ...revealMatch(),
      matchId: "expired-reveal",
      revealEndsAt: Date.now() / 1000 - 1,
    };
    const completedReveal = {
      ...expiredReveal,
      phase: "player_turn",
      message: "Your turn. Pick an attacker and an enemy target.",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => expiredReveal,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => completedReveal,
      } as Response);

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
    });

    await waitFor(() => {
      expect(result.current.match?.phase).toBe("player_turn");
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain("/api/match/expired-reveal/reveal/complete");
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
