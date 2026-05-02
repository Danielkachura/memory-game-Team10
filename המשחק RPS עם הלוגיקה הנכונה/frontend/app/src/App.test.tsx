import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

function piece(
  id: string,
  owner: "player" | "ai",
  row: number,
  col: number,
  overrides: Partial<{
    label: string;
    weapon: "rock" | "paper" | "scissors" | null;
    weaponIcon: string | null;
    role: "flag" | "decoy" | "soldier" | null;
    roleIcon: string | null;
    silhouette: boolean;
    alive: boolean;
  }> = {},
) {
  return {
    id,
    owner,
    row,
    col,
    alive: overrides.alive ?? true,
    label: overrides.label ?? (owner === "player" ? "Captain Quartz" : "Hidden Operative"),
    weapon: overrides.weapon ?? null,
    weaponIcon: overrides.weaponIcon ?? null,
    role: overrides.role ?? null,
    roleIcon: overrides.roleIcon ?? null,
    silhouette: overrides.silhouette ?? owner === "ai",
  };
}

function matchView(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    matchId: "match-1",
    phase: "player_turn",
    currentTurn: "player",
    difficulty: "medium",
    message: "Your turn. Pick an attacker and an enemy target.",
    board: [
      piece("player-1", "player", 1, 1, { weapon: "rock", weaponIcon: "🪨", role: "flag", roleIcon: "🚩", silhouette: false }),
      piece("ai-1", "ai", 6, 1, { silhouette: true }),
    ],
    stats: {
      durationSeconds: 4,
      playerDuelsWon: 0,
      playerDuelsLost: 0,
      tieSequences: 0,
      decoyAbsorbed: 0,
    },
    revealEndsAt: Date.now() / 1000 + 20,
    duel: null,
    result: null,
    ...overrides,
  };
}

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the Squad RPS setup screen", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Flag hunts, decoys, and hidden weapons/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start Match" })).toBeInTheDocument();
  });

  it("starts a match and renders hidden enemy information", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => matchView(),
    } as Response);

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Start Match" }));

    expect(await screen.findByTestId("battle-board")).toBeInTheDocument();
    expect(screen.getByLabelText(/Captain Quartz/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enemy silhouette/i)).toBeInTheDocument();
  });

  it("sends a player attack after selecting an attacker and target", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => matchView(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          matchView({
            phase: "ai_turn",
            currentTurn: "ai",
            duel: {
              attackerId: "player-1",
              attackerName: "Captain Quartz",
              attackerWeapon: "rock",
              defenderId: "ai-1",
              defenderName: "Hidden Operative",
              defenderWeapon: "scissors",
              winner: "attacker",
              tie: false,
              decoyAbsorbed: false,
              revealedRole: "soldier",
            },
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          matchView({
            phase: "player_turn",
            currentTurn: "player",
            message: "AI used a fallback valid move.",
          }),
      } as Response);

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Start Match" }));
    await user.click(await screen.findByLabelText(/Captain Quartz/i));
    await user.click(screen.getByLabelText(/Enemy silhouette/i));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/match/match-1/turn/player-attack",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ attackerId: "player-1", targetId: "ai-1" }),
        }),
      );
    });
  });
});
