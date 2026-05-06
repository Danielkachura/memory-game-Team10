interface HintPromptInput {
  totalPairs: number;
  matchedPairs: number;
  moves: number;
}

export function buildHintPrompt(input: HintPromptInput) {
  return `The player is stuck in a memory card game.
Board: ${input.totalPairs} pairs total. Found so far: ${input.matchedPairs}. Moves taken: ${input.moves}.
Give ONE cryptic hint (max 15 words). Be playful and encouraging.
Do NOT reveal exact card positions or card content directly.`;
}
