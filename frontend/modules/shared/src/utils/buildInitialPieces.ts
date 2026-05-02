import { Piece, Owner, Weapon, Role } from "../types";
import { BOARD_COLS, PLAYER_ROWS, AI_ROWS } from "../constants";

/**
 * buildInitialPieces — generates a starting roster for both squads.
 * Used for offline mode or fallback.
 */
export function buildInitialPieces(): Piece[] {
  const pieces: Piece[] = [];

  // Player Pieces (Rows 1–2)
  for (const row of PLAYER_ROWS) {
    for (let col = 1; col <= BOARD_COLS; col++) {
      pieces.push({
        id: `player-r${row}c${col}`,
        owner: "player",
        row,
        col,
        weapon: "rock", // Default
        role: "soldier",
        alive: true,
        label: "Soldier",
        weaponIcon: null,
        roleIcon: null,
        silhouette: false,
      });
    }
  }

  // AI Pieces (Rows 5–6)
  for (const row of AI_ROWS) {
    for (let col = 1; col <= BOARD_COLS; col++) {
      pieces.push({
        id: `ai-r${row}c${col}`,
        owner: "ai",
        row,
        col,
        weapon: null,
        role: null,
        alive: true,
        label: "Hidden",
        weaponIcon: null,
        roleIcon: null,
        silhouette: true,
      });
    }
  }

  return pieces;
}
