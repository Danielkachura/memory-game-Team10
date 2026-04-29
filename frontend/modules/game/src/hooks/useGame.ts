import { useEffect, useMemo, useRef, useState } from "react";

type Difficulty = "easy" | "medium" | "hard";
type Weapon = "rock" | "paper" | "scissors";
type Owner = "player" | "ai";
type Phase = "setup" | "reveal" | "player_turn" | "ai_turn" | "repick" | "finished";

export interface VisiblePiece {
  id: string;
  owner: Owner;
  row: number;
  col: number;
  alive: boolean;
  label: string;
  weapon: Weapon | null;
  weaponIcon: string | null;
  role: "soldier" | "flag" | "decoy" | null;
  roleIcon: string | null;
  silhouette: boolean;
}

interface DuelSummary {
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

interface MatchView {
  matchId: string;
  phase: Phase;
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
  duel: DuelSummary | null;
  result: { winner: Owner; reason: string } | null;
  repick?: { attackerId: string; targetId: string };
}

type TestWindow = Window & {
  __SQUAD_RPS_TEST__?: {
    finishReveal: () => Promise<void>;
    getState: () => MatchView | null;
  };
};

const DIFFICULTIES: Array<{ id: Difficulty; label: string; detail: string }> = [
  { id: "easy", label: "Easy", detail: "AI plays mostly random valid moves." },
  { id: "medium", label: "Medium", detail: "AI uses remembered reveals when possible." },
  { id: "hard", label: "Hard", detail: "AI pressures known favorable matchups." },
];

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? "{}" : JSON.stringify(body),
  });
  if (!response.ok) {
    const fallback = await response.text();
    throw new Error(fallback || `Request failed with ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export function useGame() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [match, setMatch] = useState<MatchView | null>(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealSecondsLeft, setRevealSecondsLeft] = useState(0);
  const [revealArmed, setRevealArmed] = useState(false);
  const aiInFlightRef = useRef(false);
  const matchRef = useRef<MatchView | null>(null);

  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const testWindow = window as TestWindow;
    testWindow.__SQUAD_RPS_TEST__ = {
      finishReveal: async () => {
        const current = matchRef.current;
        if (!current) {
          return;
        }
        const next = await postJson<MatchView>(`/api/match/${current.matchId}/reveal/complete`, { confirmed: true });
        setMatch(next);
      },
      getState: () => matchRef.current,
    };
    return () => {
      delete testWindow.__SQUAD_RPS_TEST__;
    };
  }, [match]);

  useEffect(() => {
    if (!match || match.phase !== "reveal") {
      setRevealSecondsLeft(0);
      setRevealArmed(false);
      return undefined;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil(match.revealEndsAt - Date.now() / 1000));
      setRevealSecondsLeft(remaining);
      if (remaining > 0) {
        setRevealArmed(true);
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [match]);

  useEffect(() => {
    if (!match || match.phase !== "reveal" || revealSecondsLeft > 0 || !revealArmed) {
      return;
    }
    void completeReveal();
  }, [match, revealSecondsLeft, revealArmed]);

  useEffect(() => {
    if (!match || match.phase !== "ai_turn" || aiInFlightRef.current) {
      return;
    }
    aiInFlightRef.current = true;
    const timeout = window.setTimeout(async () => {
      try {
        const next = await postJson<MatchView>(`/api/match/${match.matchId}/turn/ai-move`);
        setMatch(next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "AI move failed.");
      } finally {
        aiInFlightRef.current = false;
      }
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [match]);

  const boardCells = useMemo(() => {
    const lookup = new Map<string, VisiblePiece>();
    (match?.board ?? []).forEach((piece) => {
      lookup.set(`${piece.row}-${piece.col}`, piece);
    });
    const cells: Array<{ row: number; col: number; piece: VisiblePiece | null }> = [];
    for (let row = 6; row >= 1; row -= 1) {
      for (let col = 1; col <= 5; col += 1) {
        cells.push({ row, col, piece: lookup.get(`${row}-${col}`) ?? null });
      }
    }
    return cells;
  }, [match]);

  const legalMoveTargets = useMemo(() => {
    if (!match || match.phase !== "player_turn" || !selectedAttackerId) {
      return new Set<string>();
    }

    const selectedPiece = match.board.find((piece) => piece.id === selectedAttackerId);
    if (!selectedPiece || selectedPiece.owner !== "player" || !selectedPiece.alive) {
      return new Set<string>();
    }

    const occupied = new Set(
      match.board.filter((piece) => piece.alive).map((piece) => `${piece.row}-${piece.col}`),
    );
    const candidates = [
      [selectedPiece.row + 1, selectedPiece.col],
      [selectedPiece.row, selectedPiece.col - 1],
      [selectedPiece.row, selectedPiece.col + 1],
    ];

    return new Set(
      candidates
        .filter(([row, col]) => row >= 1 && row <= 6 && col >= 1 && col <= 5)
        .filter(([row, col]) => !occupied.has(`${row}-${col}`))
        .map(([row, col]) => `${row}-${col}`),
    );
  }, [match, selectedAttackerId]);

  async function startMatch() {
    setLoading(true);
    setError(null);
    setSelectedAttackerId(null);
    try {
      const created = await postJson<MatchView>("/api/match/create", { difficulty: selectedDifficulty });
      setMatch(created);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create match.");
    } finally {
      setLoading(false);
    }
  }

  async function completeReveal() {
    const current = matchRef.current;
    if (!current || current.phase !== "reveal") {
      return;
    }
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/reveal/complete`, { confirmed: true });
      setMatch(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to complete reveal.");
    }
  }

  async function attack(targetId: string) {
    const current = matchRef.current;
    if (!current || current.phase !== "player_turn" || !selectedAttackerId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/turn/player-attack`, {
        attackerId: selectedAttackerId,
        targetId,
      });
      setMatch(next);
      setSelectedAttackerId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Attack failed.");
    } finally {
      setLoading(false);
    }
  }

  async function movePiece(row: number, col: number) {
    const current = matchRef.current;
    if (!current || current.phase !== "player_turn" || !selectedAttackerId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/turn/player-move`, {
        pieceId: selectedAttackerId,
        row,
        col,
      });
      setMatch(next);
      setSelectedAttackerId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Move failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitRepick(weapon: Weapon) {
    const current = matchRef.current;
    if (!current || current.phase !== "repick") {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/turn/tie-repick`, { weapon });
      setMatch(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Repick failed.");
    } finally {
      setLoading(false);
    }
  }

  function onPieceClick(piece: VisiblePiece) {
    if (!match) {
      return;
    }
    if (match.phase !== "player_turn" || !piece.alive) {
      return;
    }
    if (piece.owner === "player") {
      setSelectedAttackerId(piece.id);
      return;
    }
    if (piece.owner === "ai" && selectedAttackerId) {
      void attack(piece.id);
    }
  }

  function onEmptyCellClick(row: number, col: number) {
    if (!selectedAttackerId || match?.phase !== "player_turn") {
      return;
    }
    void movePiece(row, col);
  }

  function resetToSetup() {
    setMatch(null);
    setSelectedAttackerId(null);
    setError(null);
    setLoading(false);
  }

  return {
    boardCells,
    difficulties: DIFFICULTIES,
    error,
    loading,
    match,
    legalMoveTargets,
    onEmptyCellClick,
    onPieceClick,
    resetToSetup,
    revealSecondsLeft,
    selectedAttackerId,
    selectedDifficulty,
    setSelectedDifficulty,
    startMatch,
    submitRepick,
  };
}
