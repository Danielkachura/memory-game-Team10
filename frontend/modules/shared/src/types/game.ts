export type Difficulty = "easy" | "medium" | "hard";
export type Weapon = "rock" | "paper" | "scissors";
export type Owner = "player" | "ai";
export type Mode = "ai" | "pvp";
export type Phase = "setup" | "reveal" | "player_turn" | "ai_turn" | "repick" | "finished";
export type Role = "soldier" | "flag" | "decoy";

export interface VisiblePiece {
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
  revealedRole?: Role;
}

export interface MatchLogEntry {
  turn: number;
  message: string;
}

export interface MatchView {
  matchId: string;
  phase: Phase;
  mode?: Mode;
  viewer?: Owner;
  currentTurn: Owner | "none";
  difficulty: Difficulty;
  message: string;
  board: VisiblePiece[];
  stats: {
    durationSeconds: number;
    playerDuelsWon: number;
    playerDuelsLost: number;
    tieSequences: number;
    decoyAbsorbed: number;
  };
  revealEndsAt: number;
  revealSeconds: number;
  turnEndsAt: number | null;
  turnSeconds: number;
  duel: DuelSummary | null;
  result: { winner: Owner; reason: string } | null;
  repick?: { attackerId: string; targetId: string; picksReceived?: string[] };
  rematch?: { status: "pending" | "declined" | "ready"; matchId?: string; message?: string };
  players?: { player?: string; ai?: string };
  eventLog?: MatchLogEntry[];
}
