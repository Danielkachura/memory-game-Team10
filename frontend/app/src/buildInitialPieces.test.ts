import { describe, it, expect } from "vitest";
import { buildInitialPieces } from "../../modules/shared/src/utils/buildInitialPieces";

describe("buildInitialPieces", () => {
  it("should generate 20 pieces", () => {
    const pieces = buildInitialPieces();
    expect(pieces).toHaveLength(20);
  });

  it("should have correct owners", () => {
    const pieces = buildInitialPieces();
    const playerPieces = pieces.filter(p => p.owner === "player");
    const aiPieces = pieces.filter(p => p.owner === "ai");
    expect(playerPieces).toHaveLength(10);
    expect(aiPieces).toHaveLength(10);
  });
});
