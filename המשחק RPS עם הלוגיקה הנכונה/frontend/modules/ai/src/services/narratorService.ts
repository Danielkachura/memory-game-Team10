import type { Difficulty } from "@shared";
import { buildNarratorPrompt } from "../prompts/narratorPrompt";
import { callClaude } from "./claudeClient";

interface NarratorInput {
  difficulty: Difficulty;
  totalPairs: number;
  moves: number;
  timeElapsed: number;
  stars: 1 | 2 | 3;
}

export async function generateNarration(input: NarratorInput) {
  try {
    return await callClaude("narrator", buildNarratorPrompt(input));
  } catch {
    return `Board cleared. You finished a ${input.difficulty} round with ${input.stars} star${input.stars > 1 ? "s" : ""}.`;
  }
}
