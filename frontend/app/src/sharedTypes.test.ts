import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("shared public game types", () => {
  it("does not export dead memory game contracts", () => {
    const source = readFileSync(resolve(__dirname, "../../modules/shared/src/types/game.ts"), "utf8");

    expect(source).not.toMatch(/export\s+(type|interface)\s+Card\b/);
    expect(source).not.toMatch(/export\s+(type|interface)\s+GameState\b/);
    expect(source).not.toMatch(/export\s+(type|interface)\s+GameStatus\b/);
    expect(source).not.toMatch(/export\s+(type|interface)\s+Theme\b/);
  });
});
