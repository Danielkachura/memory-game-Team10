import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGame } from "@game/hooks/useGame";
import { audioManager } from "@game/utils/audioManager";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useGame smoke test", () => {
  it("should initialize with setup phase", () => {
    const { result } = renderHook(() => useGame());
    expect(result.current.phase).toBe("setup");
    expect(result.current.match).toBeNull();
  });

  it("should have startMatch function", () => {
    const { result } = renderHook(() => useGame());
    expect(typeof result.current.startMatch).toBe("function");
  });

  it("should expose a legal opening move after selecting a front-row unit", async () => {
    const openingMatch = {
      matchId: "test-open",
      phase: "player_turn" as const,
      currentTurn: "player" as const,
      difficulty: "easy" as const,
      message: "Your turn.",
      board: [
        {
          id: "player-front",
          owner: "player" as const,
          row: 2,
          col: 1,
          alive: true,
          label: "Front Soldier",
          weapon: "rock" as const,
          weaponIcon: null,
          role: "soldier" as const,
          roleIcon: null,
          silhouette: false,
        },
        {
          id: "player-back",
          owner: "player" as const,
          row: 1,
          col: 1,
          alive: true,
          label: "Back Soldier",
          weapon: "paper" as const,
          weaponIcon: null,
          role: "soldier" as const,
          roleIcon: null,
          silhouette: false,
        },
        {
          id: "player-right",
          owner: "player" as const,
          row: 2,
          col: 2,
          alive: true,
          label: "Right Soldier",
          weapon: "scissors" as const,
          weaponIcon: null,
          role: "soldier" as const,
          roleIcon: null,
          silhouette: false,
        },
      ],
      stats: {
        durationSeconds: 0,
        playerDuelsWon: 0,
        playerDuelsLost: 0,
        tieSequences: 0,
        decoyAbsorbed: 0,
      },
      revealEndsAt: 0,
      turnEndsAt: Date.now() / 1000 + 10,
      duel: null,
      result: null,
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => openingMatch,
    }));

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
    });

    act(() => {
      result.current.onPieceClick(openingMatch.board[0]);
    });

    expect(result.current.selectedPieceId).toBe("player-front");
    expect(Array.from(result.current.validMoveSet)).toEqual(["3-1"]);
  });

  it("should ignore a blocked back-row unit that has no legal move", async () => {
    const blockedMatch = {
      matchId: "test-blocked",
      phase: "player_turn" as const,
      currentTurn: "player" as const,
      difficulty: "easy" as const,
      message: "Your turn.",
      board: [
        {
          id: "player-left",
          owner: "player" as const,
          row: 1,
          col: 1,
          alive: true,
          label: "Left Guard",
          weapon: "rock" as const,
          weaponIcon: null,
          role: "soldier" as const,
          roleIcon: null,
          silhouette: false,
        },
        {
          id: "player-blocked",
          owner: "player" as const,
          row: 1,
          col: 2,
          alive: true,
          label: "Blocked Soldier",
          weapon: "paper" as const,
          weaponIcon: null,
          role: "soldier" as const,
          roleIcon: null,
          silhouette: false,
        },
        {
          id: "player-right",
          owner: "player" as const,
          row: 1,
          col: 3,
          alive: true,
          label: "Right Guard",
          weapon: "scissors" as const,
          weaponIcon: null,
          role: "soldier" as const,
          roleIcon: null,
          silhouette: false,
        },
        {
          id: "player-front",
          owner: "player" as const,
          row: 2,
          col: 2,
          alive: true,
          label: "Front Guard",
          weapon: "rock" as const,
          weaponIcon: null,
          role: "soldier" as const,
          roleIcon: null,
          silhouette: false,
        },
      ],
      stats: {
        durationSeconds: 0,
        playerDuelsWon: 0,
        playerDuelsLost: 0,
        tieSequences: 0,
        decoyAbsorbed: 0,
      },
      revealEndsAt: 0,
      turnEndsAt: Date.now() / 1000 + 10,
      duel: null,
      result: null,
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => blockedMatch,
    }));

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
    });

    act(() => {
      result.current.onPieceClick(blockedMatch.board[1]);
    });

    expect(result.current.selectablePieceIds.has("player-blocked")).toBe(false);
    expect(result.current.selectedPieceId).toBeNull();
  });

  it("should shuffle the player squad only during the opening reveal", async () => {
    vi.spyOn(audioManager, "unlock").mockImplementation(() => {});
    vi.spyOn(audioManager, "play").mockImplementation(() => {});

    const revealMatch = {
      matchId: "test-shuffle",
      phase: "reveal" as const,
      currentTurn: "player" as const,
      difficulty: "easy" as const,
      message: "Memorize the enemy squad before the reveal timer ends.",
      board: [
        {
          id: "player-a",
          owner: "player" as const,
          row: 1,
          col: 1,
          alive: true,
          label: "Alpha",
          weapon: "rock" as const,
          weaponIcon: null,
          role: null,
          roleIcon: null,
          silhouette: false,
        },
        {
          id: "player-b",
          owner: "player" as const,
          row: 1,
          col: 2,
          alive: true,
          label: "Bravo",
          weapon: "paper" as const,
          weaponIcon: null,
          role: null,
          roleIcon: null,
          silhouette: false,
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
      turnEndsAt: null,
      duel: null,
      result: null,
    };

    const shuffledRevealMatch = {
      ...revealMatch,
      message: "Your squad positions were shuffled.",
      board: [
        { ...revealMatch.board[0], row: 2, col: 7 },
        { ...revealMatch.board[1], row: 2, col: 6 },
      ],
    };

    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url === "/api/match/create") {
        return {
          ok: true,
          json: async () => revealMatch,
        };
      }
      if (url === `/api/match/${revealMatch.matchId}/shuffle/player`) {
        return {
          ok: true,
          json: async () => shuffledRevealMatch,
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
    });

    await act(async () => {
      await result.current.shufflePlayerPieces();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`/api/match/${revealMatch.matchId}/shuffle/player`);
    expect(result.current.match?.message).toBe("Your squad positions were shuffled.");
    expect(result.current.match?.board.find(piece => piece.id === "player-a")?.row).toBe(2);
  });

  it("should let the player choose a flag during the opening reveal", async () => {
    const revealMatch = {
      matchId: "test-flag",
      phase: "reveal" as const,
      currentTurn: "player" as const,
      difficulty: "easy" as const,
      message: "Memorize the enemy squad before the reveal timer ends.",
      board: [
        {
          id: "player-flag-candidate",
          owner: "player" as const,
          row: 1,
          col: 3,
          alive: true,
          label: "Candidate",
          weapon: "paper" as const,
          weaponIcon: null,
          role: null,
          roleIcon: null,
          silhouette: false,
        },
        {
          id: "player-other",
          owner: "player" as const,
          row: 2,
          col: 1,
          alive: true,
          label: "Other",
          weapon: "rock" as const,
          weaponIcon: null,
          role: null,
          roleIcon: null,
          silhouette: false,
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
      turnEndsAt: null,
      duel: null,
      result: null,
    };

    const flaggedRevealMatch = {
      ...revealMatch,
      message: "Flag placed at row 1, col 3.",
      board: [
        {
          ...revealMatch.board[0],
          role: "flag" as const,
        },
        revealMatch.board[1],
      ],
    };

    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url === "/api/match/create") {
        return {
          ok: true,
          json: async () => revealMatch,
        };
      }
      if (url === `/api/match/${revealMatch.matchId}/flag/player`) {
        return {
          ok: true,
          json: async () => flaggedRevealMatch,
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
    });

    await act(async () => {
      result.current.onPieceClick(revealMatch.board[0]);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`/api/match/${revealMatch.matchId}/flag/player`);
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ pieceId: "player-flag-candidate" }),
    });
    expect(result.current.match?.board.find(piece => piece.id === "player-flag-candidate")?.role).toBe("flag");
  });

  it("should lose the match when the reveal timer expires before placing a flag", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T18:00:00.000Z"));

    const revealMatch = {
      matchId: "test-timeout-loss",
      phase: "reveal" as const,
      currentTurn: "player" as const,
      difficulty: "easy" as const,
      message: "Memorize the enemy squad before the reveal timer ends.",
      board: [
        {
          id: "player-a",
          owner: "player" as const,
          row: 1,
          col: 1,
          alive: true,
          label: "Alpha",
          weapon: "rock" as const,
          weaponIcon: null,
          role: null,
          roleIcon: null,
          silhouette: false,
        },
      ],
      stats: {
        durationSeconds: 0,
        playerDuelsWon: 0,
        playerDuelsLost: 0,
        tieSequences: 0,
        decoyAbsorbed: 0,
      },
      revealEndsAt: Date.now() / 1000,
      turnEndsAt: null,
      duel: null,
      result: null,
    };

    const timedOutMatch = {
      ...revealMatch,
      phase: "finished" as const,
      currentTurn: "none" as const,
      message: "Time ran out before you placed your flag.",
      result: {
        winner: "ai" as const,
        reason: "Time ran out before you placed your flag.",
      },
    };

    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url === "/api/match/create") {
        return {
          ok: true,
          json: async () => revealMatch,
        };
      }
      if (url === `/api/match/${revealMatch.matchId}/reveal/complete`) {
        return {
          ok: true,
          json: async () => timedOutMatch,
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`/api/match/${revealMatch.matchId}/reveal/complete`);
    expect(result.current.phase).toBe("finished");
    expect(result.current.match?.result?.winner).toBe("ai");
    expect(result.current.match?.result?.reason).toContain("Time ran out");
  });

  it("should lose the match when the player turn timer expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T18:00:00.000Z"));

    const playerTurnMatch = {
      matchId: "test-turn-timeout",
      phase: "player_turn" as const,
      currentTurn: "player" as const,
      difficulty: "easy" as const,
      message: "Your turn.",
      board: [
        {
          id: "player-a",
          owner: "player" as const,
          row: 2,
          col: 1,
          alive: true,
          label: "Alpha",
          weapon: "rock" as const,
          weaponIcon: null,
          role: "soldier" as const,
          roleIcon: null,
          silhouette: false,
        },
      ],
      stats: {
        durationSeconds: 0,
        playerDuelsWon: 0,
        playerDuelsLost: 0,
        tieSequences: 0,
        decoyAbsorbed: 0,
      },
      revealEndsAt: 0,
      turnEndsAt: Date.now() / 1000,
      duel: null,
      result: null,
    };

    const timedOutMatch = {
      ...playerTurnMatch,
      phase: "finished" as const,
      currentTurn: "none" as const,
      message: "Time ran out on your turn.",
      turnEndsAt: null,
      result: {
        winner: "ai" as const,
        reason: "Time ran out on your turn.",
      },
    };

    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url === "/api/match/create") {
        return {
          ok: true,
          json: async () => playerTurnMatch,
        };
      }
      if (url === `/api/match/${playerTurnMatch.matchId}/turn/timeout`) {
        return {
          ok: true,
          json: async () => timedOutMatch,
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`/api/match/${playerTurnMatch.matchId}/turn/timeout`);
    expect(result.current.phase).toBe("finished");
    expect(result.current.match?.result?.winner).toBe("ai");
    expect(result.current.match?.result?.reason).toContain("Time ran out");
  });

  it("should request and apply the AI move when the turn passes to AI", async () => {
    vi.useFakeTimers();

    const aiTurnMatch = {
      matchId: "test-ai-turn",
      phase: "ai_turn" as const,
      currentTurn: "ai" as const,
      difficulty: "easy" as const,
      message: "AI is choosing...",
      board: [
        {
          id: "player-advanced",
          owner: "player" as const,
          row: 3,
          col: 1,
          alive: true,
          label: "Forward Soldier",
          weapon: "rock" as const,
          weaponIcon: null,
          role: "soldier" as const,
          roleIcon: null,
          silhouette: false,
        },
        {
          id: "ai-front",
          owner: "ai" as const,
          row: 5,
          col: 1,
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
      revealEndsAt: 0,
      turnEndsAt: Date.now() / 1000 + 10,
      duel: null,
      result: null,
    };

    const afterAiMove = {
      ...aiTurnMatch,
      phase: "player_turn" as const,
      currentTurn: "player" as const,
      message: "Your turn. Select one of your front units and move to a highlighted square.",
      board: [
        aiTurnMatch.board[0],
        {
          ...aiTurnMatch.board[1],
          row: 4,
        },
      ],
    };

    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url === "/api/match/create") {
        return {
          ok: true,
          json: async () => aiTurnMatch,
        };
      }
      if (url === `/api/match/${aiTurnMatch.matchId}/turn/ai-move`) {
        return {
          ok: true,
          json: async () => afterAiMove,
        };
      }
      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startMatch();
    });

    expect(result.current.phase).toBe("ai_turn");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`/api/match/${aiTurnMatch.matchId}/turn/ai-move`);
    expect(result.current.phase).toBe("player_turn");
    expect(result.current.match?.board.find(piece => piece.id === "ai-front")?.row).toBe(4);
  });
});
