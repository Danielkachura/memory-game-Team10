import { describe, it, expect } from "vitest";
import { BOARD_COLS, BOARD_ROWS, UNITS_PER_SQUAD, REVEAL_DURATION_SECONDS } from "../../src/constants";

describe("Squad RPS Constants", () => {
  it("should have canonical board dimensions", () => {
    expect(BOARD_COLS).toBe(7);
    expect(BOARD_ROWS).toBe(6);
  });

  it("should have canonical squad size", () => {
    expect(UNITS_PER_SQUAD).toBe(14);
  });

  it("should have canonical reveal duration", () => {
    expect(REVEAL_DURATION_SECONDS).toBe(10);
  });
});
