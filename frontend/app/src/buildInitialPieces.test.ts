import { describe, it, expect } from "vitest";
import { buildInitialPieces } from "../../modules/shared/src/utils/buildInitialPieces";

describe("buildInitialPieces", () => {
  it("should generate 28 pieces", () => {
    const pieces = buildInitialPieces();
    expect(pieces).toHaveLength(28);
  });

  it("should have correct owners", () => {
    const pieces = buildInitialPieces();
    const playerPieces = pieces.filter(p => p.owner === "player");
    const aiPieces = pieces.filter(p => p.owner === "ai");
    expect(playerPieces).toHaveLength(14);
    expect(aiPieces).toHaveLength(14);
  });

  it("should fill two full 7-cell rows for each squad", () => {
    const pieces = buildInitialPieces();
    const playerRows = new Map<number, number>();
    const aiRows = new Map<number, number>();

    pieces
      .filter(p => p.owner === "player")
      .forEach((piece) => playerRows.set(piece.row, (playerRows.get(piece.row) ?? 0) + 1));

    pieces
      .filter(p => p.owner === "ai")
      .forEach((piece) => aiRows.set(piece.row, (aiRows.get(piece.row) ?? 0) + 1));

    expect(playerRows.get(1)).toBe(7);
    expect(playerRows.get(2)).toBe(7);
    expect(aiRows.get(5)).toBe(7);
    expect(aiRows.get(6)).toBe(7);
  });
});
