import { render, screen } from "@testing-library/react";
import { App } from "./App";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockState = {
  matchId: "test01",
  board: [],
  phase: "reveal",
  message: "Test message",
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

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockState,
  }));
});

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });
});
