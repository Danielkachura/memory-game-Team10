import { describe, expect, it, vi } from "vitest";
import {
  DIFFICULTY_OPTIONS,
  GRID_BY_DIFFICULTY,
  PAIRS_BY_DIFFICULTY,
  calculateStars,
} from "@shared";
import { buildDeck } from "@game/utils/buildDeck";
import { matchCheck } from "@game/utils/matchCheck";
import { shuffle } from "@game/utils/shuffle";

describe("shared Memory Game rules", () => {
  it("defines canonical difficulty and grid values", () => {
    expect(PAIRS_BY_DIFFICULTY.easy).toBe(6);
    expect(PAIRS_BY_DIFFICULTY.medium).toBe(8);
    expect(PAIRS_BY_DIFFICULTY.hard).toBe(12);
    expect(DIFFICULTY_OPTIONS).toHaveLength(3);
    expect(GRID_BY_DIFFICULTY.easy.label).toBe("4 x 3");
    expect(GRID_BY_DIFFICULTY.hard.label).toBe("6 x 4");
  });

  it("calculates stars from the documented thresholds", () => {
    expect(calculateStars("easy", 12)).toBe(3);
    expect(calculateStars("easy", 18)).toBe(2);
    expect(calculateStars("hard", 60)).toBe(1);
  });

  it("creates a valid paired deck for the selected game", () => {
    const deck = buildDeck("easy", "animals");

    expect(deck).toHaveLength(12);
    const pairCounts = new Map<string, number>();
    deck.forEach((card) => {
      pairCounts.set(card.pairId, (pairCounts.get(card.pairId) ?? 0) + 1);
    });
    expect([...pairCounts.values()]).toEqual(Array(6).fill(2));
  });

  it("can create an ordered deck for deterministic QA flows", () => {
    const deck = buildDeck("easy", "animals", undefined, true);

    expect(deck[0].id).toBe("animals-0-a");
    expect(deck[1].id).toBe("animals-0-b");
    expect(deck[10].id).toBe("animals-5-a");
    expect(deck[11].id).toBe("animals-5-b");
  });

  it("matches cards only by pair id", () => {
    expect(
      matchCheck(
        { id: "a", pairId: "pair-1", content: "🐶", isFlipped: false, isMatched: false },
        { id: "b", pairId: "pair-1", content: "🐶", isFlipped: false, isMatched: false },
      ),
    ).toBe(true);

    expect(
      matchCheck(
        { id: "a", pairId: "pair-1", content: "🐶", isFlipped: false, isMatched: false },
        { id: "b", pairId: "pair-2", content: "🐱", isFlipped: false, isMatched: false },
      ),
    ).toBe(false);
  });

  it("shuffles without losing items", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const original = [1, 2, 3, 4];
    const result = shuffle(original);

    expect(result).not.toBe(original);
    expect([...result].sort()).toEqual(original);
    vi.restoreAllMocks();
  });
});
