export type Difficulty = "easy" | "medium" | "hard";

export type Theme = "animals" | "flags" | "space" | "custom-ai";

export type GameStatus = "idle" | "playing" | "paused" | "won";

export interface Card {
  id: string;
  pairId: string;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameState {
  cards: Card[];
  flippedIds: string[];
  matchedPairs: number;
  totalPairs: number;
  moves: number;
  timeElapsed: number;
  status: GameStatus;
  difficulty: Difficulty;
  theme: Theme;
}

export interface Score {
  moves: number;
  timeElapsed: number;
  difficulty: Difficulty;
  stars: 1 | 2 | 3;
}
