import { CUSTOM_AI_FALLBACK_CONTENT, PAIRS_BY_DIFFICULTY, THEME_CONTENT } from "@shared";
import type { Card, Difficulty, Theme } from "@shared";
import { shuffle } from "./shuffle";

function contentPool(theme: Theme, providedContent?: string[]) {
  if (theme === "custom-ai") {
    return providedContent?.length ? providedContent : CUSTOM_AI_FALLBACK_CONTENT;
  }
  return THEME_CONTENT[theme];
}

export function buildDeck(
  difficulty: Difficulty,
  theme: Theme,
  providedContent?: string[],
  ordered = false,
): Card[] {
  const pairCount = PAIRS_BY_DIFFICULTY[difficulty];
  const selected = contentPool(theme, providedContent).slice(0, pairCount);
  const cards = selected.flatMap((content, index) => {
    const pairId = `${theme}-${index}`;
    return [
      { id: `${pairId}-a`, pairId, content, isFlipped: false, isMatched: false },
      { id: `${pairId}-b`, pairId, content, isFlipped: false, isMatched: false },
    ];
  });

  return ordered ? cards : shuffle(cards);
}
