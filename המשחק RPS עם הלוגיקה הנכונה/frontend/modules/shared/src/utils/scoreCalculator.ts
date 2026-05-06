import type { Difficulty, Score } from "../types/game";

const STAR_THRESHOLDS: Record<Difficulty, { three: number; two: number }> = {
  easy: { three: 12, two: 18 },
  medium: { three: 20, two: 30 },
  hard: { three: 35, two: 50 },
};

export function calculateStars(difficulty: Difficulty, moves: number): Score["stars"] {
  const thresholds = STAR_THRESHOLDS[difficulty];
  if (moves <= thresholds.three) {
    return 3;
  }
  if (moves <= thresholds.two) {
    return 2;
  }
  return 1;
}
