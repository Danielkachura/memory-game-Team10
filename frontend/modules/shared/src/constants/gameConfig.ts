import type { Difficulty } from "../types/game";
import type { MemoryTheme } from "./themeContent";

export const PAIRS_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 12,
};

export const GRID_BY_DIFFICULTY: Record<Difficulty, { columns: number; rows: number; label: string }> =
  {
    easy: { columns: 4, rows: 3, label: "4 x 3" },
    medium: { columns: 4, rows: 4, label: "4 x 4" },
    hard: { columns: 6, rows: 4, label: "6 x 4" },
  };

export const APP_THEME_OPTIONS: Array<{ id: MemoryTheme; label: string; description: string }> = [
  { id: "animals", label: "Animals", description: "Friendly creatures and emoji pairs." },
  { id: "flags", label: "Flags", description: "Country flag matching challenges." },
  { id: "space", label: "Space", description: "Planets, rockets, and cosmic symbols." },
  { id: "custom-ai", label: "Custom AI", description: "Claude generates a fresh board theme." },
];

export const DIFFICULTY_OPTIONS = (Object.keys(GRID_BY_DIFFICULTY) as Difficulty[]).map(
  (difficulty) => ({
    id: difficulty,
    label: difficulty,
    gridLabel: GRID_BY_DIFFICULTY[difficulty].label,
    pairs: PAIRS_BY_DIFFICULTY[difficulty],
  }),
);
