import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useGame } from "../../modules/game/src/hooks/useGame";

vi.mock("@ai", () => ({
  generateHint: vi.fn().mockResolvedValue("hint"),
  generateNarration: vi.fn().mockResolvedValue("narration"),
  generateThemeContent: vi.fn().mockResolvedValue([]),
}));

describe("useGame", () => {
  it("flips mismatched cards back down after the delay", async () => {
    const { result } = renderHook(() => useGame());

    await act(async () => {
      await result.current.startGame();
    });

    const [firstCard, mismatchCard] = (() => {
      const [first, ...rest] = result.current.game.cards;
      const mismatch = rest.find((card) => card.pairId !== first.pairId);

      if (!mismatch) {
        throw new Error("Expected to find a mismatched card in the deck.");
      }

      return [first, mismatch];
    })();

    act(() => {
      result.current.flipCard(firstCard.id);
      result.current.flipCard(mismatchCard.id);
    });

    expect(result.current.game.flippedIds).toEqual([firstCard.id, mismatchCard.id]);
    expect(result.current.game.cards.filter((card) => card.isFlipped)).toHaveLength(2);

    await waitFor(
      () => {
        expect(result.current.game.flippedIds).toHaveLength(0);
        expect(result.current.game.cards.filter((card) => card.isFlipped)).toHaveLength(0);
      },
      { timeout: 2000 },
    );
  });
});
