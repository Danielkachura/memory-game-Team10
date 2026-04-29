import { buildHintPrompt } from "../prompts/hintPrompt";
import { callClaude } from "./claudeClient";

interface HintInput {
  totalPairs: number;
  matchedPairs: number;
  moves: number;
}

export async function generateHint(input: HintInput) {
  try {
    return await callClaude("hint", buildHintPrompt(input));
  } catch {
    return "Trust your freshest memory and sweep the edges before the center.";
  }
}
