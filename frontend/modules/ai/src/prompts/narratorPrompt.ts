import type { Difficulty } from "@shared";

interface NarratorPromptInput {
  difficulty: Difficulty;
  totalPairs: number;
  moves: number;
  timeElapsed: number;
  stars: 1 | 2 | 3;
}

export function buildNarratorPrompt(input: NarratorPromptInput) {
  return `A player just finished a memory game.
Stats: difficulty=${input.difficulty}, pairs=${input.totalPairs}, moves=${input.moves}, time=${input.timeElapsed}s, stars=${input.stars}/3.
Write exactly 2 sentences reacting to their performance.
Tone: triumphant if 3 stars, encouraging if 2 stars, playful if 1 star.`;
}
