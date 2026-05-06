export type Owner = "player" | "ai";
export type Difficulty = "easy" | "medium" | "hard";
export type Phase = "setup" | "reveal" | "player_turn" | "ai_turn" | "repick" | "finished";
export type Weapon = "rock" | "paper" | "scissors";
export type Role = "soldier" | "flag" | "decoy";

export interface Piece {
  id: string;
  owner: Owner;
  row: number;
  col: number;
  alive: boolean;
  label: string;
  weapon: Weapon | null;
  weaponIcon: string | null;
  role: Role | null;
  roleIcon: string | null;
  silhouette: boolean;
}

export interface BoardCell {
  row: number;
  col: number;
  piece: Piece | null;
}

export interface DuelSummary {
  attackerId: string;
  attackerName: string;
  attackerWeapon: Weapon;
  defenderId: string;
  defenderName: string;
  defenderWeapon: Weapon;
  winner: "attacker" | "defender" | "tie";
  tie: boolean;
  decoyAbsorbed: boolean;
  eliminatedId?: string;
  revealedRole?: string;
}

export interface MatchStats {
  durationSeconds: number;
  playerDuelsWon: number;
  playerDuelsLost: number;
  tieSequences: number;
  decoyAbsorbed: number;
}

export interface MatchView {
  matchId: string;
  phase: Phase;
  currentTurn: Owner | "none";
  difficulty: Difficulty;
  message: string;
  board: Piece[];
  stats: MatchStats;
  revealEndsAt: number;
  turnEndsAt: number | null;
  duel: DuelSummary | null;
  result: { winner: Owner; reason: string } | null;
  repick?: { attackerId: string; targetId: string };
}
