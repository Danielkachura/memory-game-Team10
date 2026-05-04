import { CUSTOM_AI_FALLBACK_CONTENT, PAIRS_BY_DIFFICULTY, THEME_CONTENT } from "@shared";
import type { Difficulty } from "@shared";
import type { MemoryTheme } from "@shared/constants/themeContent";
import { shuffle } from "./shuffle";

export interface MemoryCardData {
  id: string;
  pairId: string;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function contentPool(theme: MemoryTheme, providedContent?: string[]) {
  if (theme === "custom-ai") {
    return providedContent?.length ? providedContent : CUSTOM_AI_FALLBACK_CONTENT;
  }
  return THEME_CONTENT[theme];
}

export function buildDeck(
  difficulty: Difficulty,
  theme: MemoryTheme,
  providedContent?: string[],
  ordered = false,
): MemoryCardData[] {
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
