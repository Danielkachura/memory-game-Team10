import { Piece, Weapon } from "../types";
import { AI_ROWS, BOARD_COLS, PLAYER_ROWS, UNITS_PER_SQUAD } from "../constants";

const WEAPON_ROTATION: Weapon[] = ["rock", "paper", "scissors"];

const DEFAULT_WEAPONS: Weapon[] = Array.from(
  { length: UNITS_PER_SQUAD },
  (_, index) => WEAPON_ROTATION[index % WEAPON_ROTATION.length]!,
);

function buildSquad(owner: "player" | "ai", rows: readonly number[], silhouette: boolean, label: string): Piece[] {
  return Array.from({ length: UNITS_PER_SQUAD }, (_, index) => {
    const row = rows[Math.floor(index / BOARD_COLS)]!;
    const col = (index % BOARD_COLS) + 1;

    return {
      id: `${owner}-r${row}c${col}`,
      owner,
      row,
      col,
      weapon: DEFAULT_WEAPONS[index],
      role: "soldier",
      alive: true,
      label,
      weaponIcon: null,
      roleIcon: null,
      silhouette,
    };
  });
}

/**
 * buildInitialPieces generates a canonical starting roster for both squads.
 * Used for offline mode or fallback.
 */
export function buildInitialPieces(): Piece[] {
  return [
    ...buildSquad("player", PLAYER_ROWS, false, "Soldier"),
    ...buildSquad("ai", AI_ROWS, true, "Hidden"),
  ];
}
