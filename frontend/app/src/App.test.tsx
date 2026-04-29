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
    label: overrides.label ?? (owner === "player" ? "Rock flag" : "Hidden Operative"),
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
    expect(screen.getByLabelText(/Rock flag/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enemy silhouette/i)).toBeInTheDocument();
  });

  it("sends a player move after selecting a piece and an empty legal cell", async () => {
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
            board: [
              piece("player-1", "player", 2, 1, { weapon: "rock", weaponIcon: "🪨", role: "flag", roleIcon: "🚩", silhouette: false }),
              piece("ai-1", "ai", 6, 1, { silhouette: true }),
            ],
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
    await user.click(await screen.findByLabelText(/Rock flag/i));
    await user.click(screen.getByLabelText(/Empty cell row 2 col 1/i));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/match/match-1/turn/player-move",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ pieceId: "player-1", row: 2, col: 1 }),
        }),
      );
    });
  });
});
