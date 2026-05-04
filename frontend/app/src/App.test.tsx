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
    eventLog: [{ turn: 1, message: "Match created. Mode: ai. Difficulty: medium. Reveal started." }],
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
    expect(screen.getByRole("button", { name: /Play 2 Players/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Play vs Claude/i })).toBeInTheDocument();
  });

  it("starts a match and renders hidden enemy information", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => matchView(),
    } as Response);

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Play vs Claude/i }));
    await user.click(screen.getByRole("button", { name: "Start Match" }));

    expect(await screen.findByTestId("battle-board")).toBeInTheDocument();
    expect(screen.getByLabelText(/Rock flag/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enemy silhouette/i)).toBeInTheDocument();
    expect(screen.getByTestId("debug-log-panel")).toHaveTextContent(/Match created/i);
    expect(screen.getByText(/Blue cells:/i)).toBeInTheDocument();
    expect(screen.getByText(/Rose cells:/i)).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: /Play vs Claude/i }));
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

  it("does not send a long-range attack when the enemy is not adjacent", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        matchView({
          board: [
            piece("player-1", "player", 2, 3, {
              label: "Paper",
              weapon: "paper",
              weaponIcon: "P",
              silhouette: false,
            }),
            piece("ai-1", "ai", 5, 3, { silhouette: true }),
          ],
        }),
    } as Response);

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Play vs Claude/i }));
    await user.click(screen.getByRole("button", { name: "Start Match" }));
    await user.click(await screen.findByLabelText(/Paper/i));
    await user.click(screen.getByLabelText(/Enemy silhouette/i));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Blocked: you can only duel an adjacent enemy target/i)).toBeInTheDocument();
  });

  it("shows reveal lock messaging during reveal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () =>
        matchView({
          phase: "reveal",
          message: "Memorize the enemy squad before the reveal timer ends.",
        }),
    } as Response);

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Play vs Claude/i }));
    await user.click(screen.getByRole("button", { name: "Start Match" }));

    expect(await screen.findByText(/Board locked/i)).toBeInTheDocument();
    expect(screen.getByText(/\ds left/i)).toBeInTheDocument();
  });

  it("marks adjacent enemies as legal duel targets after selecting a piece", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () =>
        matchView({
          board: [
            piece("player-1", "player", 2, 3, {
              label: "Paper",
              weapon: "paper",
              weaponIcon: "P",
              silhouette: false,
            }),
            piece("ai-1", "ai", 3, 3, { silhouette: true }),
          ],
        }),
    } as Response);

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Play vs Claude/i }));
    await user.click(screen.getByRole("button", { name: "Start Match" }));
    await user.click(await screen.findByLabelText(/^Paper P$/i));

    expect(screen.getByLabelText(/adjacent legal duel target/i)).toHaveAttribute("data-attackable", "true");
    expect(screen.getByText("Legal duels")).toBeInTheDocument();
  });

  it("shows the moved piece in the new cell before the AI response arrives", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          matchView({
            board: [
              piece("player-1", "player", 2, 3, {
                label: "Paper",
                weapon: "paper",
                weaponIcon: "P",
                silhouette: false,
              }),
              piece("ai-1", "ai", 5, 3, { silhouette: true }),
            ],
          }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () =>
          matchView({
            phase: "ai_turn",
            currentTurn: "ai",
            board: [
              piece("player-1", "player", 3, 3, {
                label: "Paper",
                weapon: "paper",
                weaponIcon: "P",
                silhouette: false,
              }),
              piece("ai-1", "ai", 5, 3, { silhouette: true }),
            ],
          }),
      } as Response);

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Play vs Claude/i }));
    await user.click(screen.getByRole("button", { name: "Start Match" }));
    await user.click(await screen.findByLabelText(/^Paper P$/i));
    await user.click(screen.getByLabelText(/Empty cell row 3 col 3/i));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/match/match-1/turn/player-move",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ pieceId: "player-1", row: 3, col: 3 }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText("Paper").length).toBeGreaterThan(0);
    });
  });
});
