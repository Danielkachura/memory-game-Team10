import { describe, expect, it, vi } from "vitest";
import {
  buildHintPrompt,
  buildNarratorPrompt,
  buildThemePrompt,
  generateHint,
  generateNarration,
  generateThemeContent,
} from "@ai";

describe("AI prompts and fallback services", () => {
  it("builds prompt text for each feature", () => {
    expect(buildThemePrompt("retro arcade", 6)).toContain("Generate 6 unique memory card content items");
    expect(buildHintPrompt({ totalPairs: 8, matchedPairs: 2, moves: 9 })).toContain("Moves taken: 9");
    expect(
      buildNarratorPrompt({ difficulty: "medium", totalPairs: 8, moves: 20, timeElapsed: 40, stars: 3 }),
    ).toContain("stars=3/3");
  });

  it("falls back for theme generation when the proxy fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network"));
    const values = await generateThemeContent("custom", 6);
    expect(values).toHaveLength(6);
    vi.restoreAllMocks();
  });

  it("falls back for hint and narrator when the proxy fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    await expect(generateHint({ totalPairs: 6, matchedPairs: 2, moves: 7 })).resolves.toContain("memory");
    await expect(
      generateNarration({ difficulty: "easy", totalPairs: 6, moves: 12, timeElapsed: 30, stars: 3 }),
    ).resolves.toContain("Board cleared");
    vi.restoreAllMocks();
  });
});
