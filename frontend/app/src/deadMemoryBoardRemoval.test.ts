import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dead Memory Game board files", () => {
  it("removes the obsolete GameBoard and MemoryCard components from the Squad RPS codebase", () => {
    expect(existsSync(resolve(__dirname, "../../modules/game/src/components/GameBoard.tsx"))).toBe(false);
    expect(existsSync(resolve(__dirname, "../../modules/game/src/components/MemoryCard.tsx"))).toBe(false);
  });
});
