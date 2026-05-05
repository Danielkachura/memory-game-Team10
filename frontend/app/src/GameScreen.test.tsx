import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameScreen } from "../../modules/game/src/components/GameScreen";

function repickMatch(picksReceived: string[] = []) {
  return {
    matchId: "match-pvp-1",
    phase: "repick",
    mode: "pvp",
    viewer: "player",
    currentTurn: "player",
    difficulty: "medium",
    message: picksReceived.length > 0 ? "Waiting for the other player to pick their tie weapon." : "Tie. Pick a new weapon to continue the duel.",
    board: [
      {
        id: "player-1",
        owner: "player",
        row: 3,
        col: 2,
        alive: true,
        label: "Rock flag",
        weapon: "rock",
        weaponIcon: "R",
        role: "flag",
        roleIcon: "F",
        silhouette: false,
      },
      {
        id: "ai-1",
        owner: "ai",
        row: 4,
        col: 2,
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
      durationSeconds: 12,
      playerDuelsWon: 0,
      playerDuelsLost: 0,
      tieSequences: 1,
      decoyAbsorbed: 0,
    },
    revealEndsAt: Date.now() / 1000 + 10,
    duel: {
      attackerId: "player-1",
      attackerName: "Rock flag",
      attackerWeapon: "rock",
      defenderId: "ai-1",
      defenderName: "Hidden Operative",
      defenderWeapon: "rock",
      winner: "tie",
      tie: true,
      decoyAbsorbed: false,
    },
    repick: {
      attackerId: "player-1",
      targetId: "ai-1",
      picksReceived,
    },
    result: null,
    players: {
      player: "Red Squad",
      ai: "Blue Squad",
    },
    eventLog: [{ turn: 1, message: "Tie. Repick required." }],
  };
}

function playerTurnMatch(message = "Your turn. Pick an attacker and an enemy target.") {
  return {
    ...repickMatch(),
    phase: "player_turn",
    mode: "ai",
    viewer: "player",
    currentTurn: "player",
    message,
    duel: null,
    repick: undefined,
  };
}

describe("GameScreen repick flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("closes the repick chooser after the local player locks a new weapon", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => repickMatch(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => repickMatch(["attacker"]),
      } as Response);

    const user = userEvent.setup();
    render(<GameScreen initialMatchId="match-pvp-1" token="player-token" />);

    expect(await screen.findByText(/SELECT NEW WEAPON/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Choose Paper/i }));

    await waitFor(() => {
      expect(screen.queryByText(/SELECT NEW WEAPON/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/Waiting for the other player to pick their tie weapon/i)).toBeInTheDocument();
  });

  it("shows a dedicated lone decoy notice when the backend message reports stalemate", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => playerTurnMatch("Lone Decoy remaining — now killable."),
    } as Response);

    render(<GameScreen initialMatchId="match-ai-1" token="player-token" />);

    expect(await screen.findByTestId("stalemate-notice")).toHaveTextContent(/Lone Decoy remaining/i);
  });

  it("renders forced tie-resolution messages from the event log", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...playerTurnMatch(),
        eventLog: [{ turn: 7, message: "Forced resolution after 5 consecutive ties." }],
      }),
    } as Response);

    render(<GameScreen initialMatchId="match-ai-2" token="player-token" />);

    expect(await screen.findByTestId("debug-log-panel")).toHaveTextContent("Forced resolution after 5 consecutive ties.");
  });
});
