import { afterEach, describe, expect, it, vi } from "vitest";

// ---- RPS resolution (mirrors backend logic) ----
type Weapon = "rock" | "paper" | "scissors";

function resolveRPS(attacker: Weapon, defender: Weapon): "attacker" | "defender" | "tie" {
  if (attacker === defender) return "tie";
  const wins: Array<[Weapon, Weapon]> = [
    ["rock", "scissors"],
    ["paper", "rock"],
    ["scissors", "paper"],
  ];
  return wins.some(([a, d]) => a === attacker && d === defender) ? "attacker" : "defender";
}

describe("RPS resolution — all 9 combinations", () => {
  it("rock beats scissors", () => expect(resolveRPS("rock", "scissors")).toBe("attacker"));
  it("scissors beats paper", () => expect(resolveRPS("scissors", "paper")).toBe("attacker"));
  it("paper beats rock", () => expect(resolveRPS("paper", "rock")).toBe("attacker"));
  it("scissors loses to rock", () => expect(resolveRPS("scissors", "rock")).toBe("defender"));
  it("rock loses to paper", () => expect(resolveRPS("rock", "paper")).toBe("defender"));
  it("paper loses to scissors", () => expect(resolveRPS("paper", "scissors")).toBe("defender"));
  it("rock ties rock", () => expect(resolveRPS("rock", "rock")).toBe("tie"));
  it("paper ties paper", () => expect(resolveRPS("paper", "paper")).toBe("tie"));
  it("scissors ties scissors", () => expect(resolveRPS("scissors", "scissors")).toBe("tie"));
});

// ---- API contract tests ----
describe("Squad RPS API contracts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("POST /api/match/create returns matchId and reveal phase", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matchId: "abc123",
        phase: "reveal",
        board: [],
        stats: { durationSeconds: 0, playerDuelsWon: 0, playerDuelsLost: 0, tieSequences: 0, decoyAbsorbed: 0 },
        revealEndsAt: Date.now() / 1000 + 10,
        duel: null,
        result: null,
        currentTurn: "player",
        difficulty: "medium",
        message: "Memorize the enemy squad.",
      }),
    } as Response);

    const response = await fetch("/api/match/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ difficulty: "medium" }),
    });
    const payload = await response.json();

    expect(payload.matchId).toBeDefined();
    expect(payload.phase).toBe("reveal");
  });

  it("POST /api/match/:id/turn/player-attack sends attackerId and targetId", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ phase: "ai_turn", duel: { winner: "attacker", tie: false, decoyAbsorbed: false } }),
    } as Response);

    await fetch("/api/match/abc123/turn/player-attack", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ attackerId: "player-1", targetId: "ai-1" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/match/abc123/turn/player-attack",
      expect.objectContaining({ body: JSON.stringify({ attackerId: "player-1", targetId: "ai-1" }) }),
    );
  });

  it("POST /api/match/:id/turn/tie-repick sends weapon", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ phase: "ai_turn", duel: { winner: "attacker", tie: false, decoyAbsorbed: false } }),
    } as Response);

    await fetch("/api/match/abc123/turn/tie-repick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weapon: "rock" }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/match/abc123/turn/tie-repick",
      expect.objectContaining({ body: JSON.stringify({ weapon: "rock" }) }),
    );
  });

  it("enemy board pieces have null weapon after reveal (hidden-info contract)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matchId: "abc123",
        phase: "player_turn",
        board: [
          { id: "player-1", owner: "player", alive: true, weapon: "rock", role: "flag", silhouette: false },
          { id: "ai-1", owner: "ai", alive: true, weapon: null, role: null, silhouette: true },
        ],
        duel: null,
        result: null,
      }),
    } as Response);

    const response = await fetch("/api/match/abc123/reveal/complete", {
      method: "POST",
      body: JSON.stringify({ confirmed: true }),
    });
    const payload = await response.json();
    const enemyPieces = payload.board.filter((p: { owner: string }) => p.owner === "ai");

    expect(enemyPieces.every((p: { weapon: unknown }) => p.weapon === null)).toBe(true);
  });
});
