export type Difficulty = "easy" | "medium" | "hard";

export interface Score {
  moves: number;
  timeElapsed: number;
  difficulty: Difficulty;
  stars: 1 | 2 | 3;
}
