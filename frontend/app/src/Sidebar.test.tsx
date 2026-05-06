import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "@game/components/Sidebar";

const SHUFFLE_LABEL = "\u05e2\u05e8\u05d1\u05d1 \u05d7\u05d9\u05d9\u05dc\u05d9\u05dd";
const RESET_LABEL = "\u05d0\u05d9\u05e4\u05d5\u05e1 \u05de\u05e9\u05d7\u05e7";
const BACK_LABEL = "\u05d7\u05d6\u05e8\u05d4 \u05dc\u05ea\u05e4\u05e8\u05d9\u05d8 \u05d4\u05e8\u05d0\u05e9\u05d9";

describe("Sidebar", () => {
  it("should show the shuffle button only during reveal and call all handlers", () => {
    const onShufflePositions = vi.fn().mockResolvedValue(undefined);
    const onResetGame = vi.fn().mockResolvedValue(undefined);
    const onBackToMenu = vi.fn();

    render(
      <Sidebar
        phase="reveal"
        revealTimer={0}
        turnTimer={0}
        stats={{
          durationSeconds: 12,
          playerDuelsWon: 2,
          playerDuelsLost: 1,
          tieSequences: 0,
          decoyAbsorbed: 1,
        }}
        match={{
          matchId: "match-1",
          phase: "reveal",
          currentTurn: "player",
          difficulty: "medium",
          message: "Your turn.",
          board: [
            {
              id: "player-1",
              owner: "player",
              row: 2,
              col: 1,
              alive: true,
              label: "Red One",
              weapon: "rock",
              weaponIcon: null,
              role: "soldier",
              roleIcon: null,
              silhouette: false,
            },
            {
              id: "ai-1",
              owner: "ai",
              row: 5,
              col: 1,
              alive: true,
              label: "Blue One",
              weapon: null,
              weaponIcon: null,
              role: null,
              roleIcon: null,
              silhouette: true,
            },
          ],
          stats: {
            durationSeconds: 12,
            playerDuelsWon: 2,
            playerDuelsLost: 1,
            tieSequences: 0,
            decoyAbsorbed: 1,
          },
          revealEndsAt: 0,
          turnEndsAt: null,
          duel: null,
          result: null,
        }}
        difficulty="medium"
        loading={false}
        onShufflePositions={onShufflePositions}
        onResetGame={onResetGame}
        onBackToMenu={onBackToMenu}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: SHUFFLE_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: RESET_LABEL }));
    fireEvent.click(screen.getByRole("button", { name: BACK_LABEL }));

    expect(onShufflePositions).toHaveBeenCalledTimes(1);
    expect(onResetGame).toHaveBeenCalledTimes(1);
    expect(onBackToMenu).toHaveBeenCalledTimes(1);
  });

  it("should hide the shuffle button after the player chooses a flag", () => {
    render(
      <Sidebar
        phase="reveal"
        revealTimer={0}
        turnTimer={0}
        stats={{
          durationSeconds: 12,
          playerDuelsWon: 2,
          playerDuelsLost: 1,
          tieSequences: 0,
          decoyAbsorbed: 1,
        }}
        match={{
          matchId: "match-2",
          phase: "reveal",
          currentTurn: "player",
          difficulty: "medium",
          message: "Your turn.",
          board: [
            {
              id: "player-flag",
              owner: "player",
              row: 1,
              col: 1,
              alive: true,
              label: "Chosen Flag",
              weapon: "rock",
              weaponIcon: null,
              role: "flag",
              roleIcon: null,
              silhouette: false,
            },
          ],
          stats: {
            durationSeconds: 12,
            playerDuelsWon: 2,
            playerDuelsLost: 1,
            tieSequences: 0,
            decoyAbsorbed: 1,
          },
          revealEndsAt: 0,
          turnEndsAt: null,
          duel: null,
          result: null,
        }}
        difficulty="medium"
        loading={false}
        onShufflePositions={vi.fn().mockResolvedValue(undefined)}
        onResetGame={vi.fn().mockResolvedValue(undefined)}
        onBackToMenu={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: SHUFFLE_LABEL })).toBeNull();
  });

  it("should hide the shuffle button after the opening reveal", () => {
    render(
      <Sidebar
        phase="player_turn"
        revealTimer={0}
        turnTimer={10}
        stats={{
          durationSeconds: 12,
          playerDuelsWon: 2,
          playerDuelsLost: 1,
          tieSequences: 0,
          decoyAbsorbed: 1,
        }}
        match={{
          matchId: "match-3",
          phase: "player_turn",
          currentTurn: "player",
          difficulty: "medium",
          message: "Your turn.",
          board: [],
          stats: {
            durationSeconds: 12,
            playerDuelsWon: 2,
            playerDuelsLost: 1,
            tieSequences: 0,
            decoyAbsorbed: 1,
          },
          revealEndsAt: 0,
          turnEndsAt: Date.now() / 1000 + 10,
          duel: null,
          result: null,
        }}
        difficulty="medium"
        loading={false}
        onShufflePositions={vi.fn().mockResolvedValue(undefined)}
        onResetGame={vi.fn().mockResolvedValue(undefined)}
        onBackToMenu={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: SHUFFLE_LABEL })).toBeNull();
  });
});
