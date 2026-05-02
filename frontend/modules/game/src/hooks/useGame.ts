import { useEffect, useMemo, useRef, useState } from "react";

export type Difficulty = "easy" | "medium" | "hard";
export type Weapon = "rock" | "paper" | "scissors";
export type Owner = "player" | "ai";
export type Mode = "ai" | "pvp";
export type Phase = "setup" | "reveal" | "player_turn" | "ai_turn" | "repick" | "finished";

export interface UseGameOptions {
  /** PVP only: existing match to attach to. If provided, no new match is created. */
  initialMatchId?: string;
  /** PVP only: session token issued by the lobby. Sent as X-Player-Token. */
  token?: string;
}

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

interface ActionFeedback {
  tone: "info" | "warning";
  message: string;
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

interface MatchLogEntry {
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
  duel: DuelSummary | null;
  result: { winner: Owner; reason: string } | null;
  repick?: { attackerId: string; targetId: string; picksReceived?: string[] };
  rematch?: { status: "pending" | "declined" | "ready"; matchId?: string; message?: string };
  players?: { player?: string; ai?: string };
  eventLog?: MatchLogEntry[];
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

import { API_BASE } from "../utils/apiBase";

async function postJson<T>(url: string, body?: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) {
    headers["x-player-token"] = token;
  }
  const response = await fetch(API_BASE + url, {
    method: "POST",
    headers,
    body: body === undefined ? "{}" : JSON.stringify(body),
  });
  if (!response.ok) {
    const fallback = await response.text();
    throw new Error(fallback || `Request failed with ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

async function getJson<T>(url: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["x-player-token"] = token;
  }
  const response = await fetch(API_BASE + url, { method: "GET", headers });
  if (!response.ok) {
    const fallback = await response.text();
    throw new Error(fallback || `Request failed with ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

export function useGame(options: UseGameOptions = {}) {
  const { initialMatchId, token } = options;
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [match, setMatch] = useState<MatchView | null>(null);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [revealSecondsLeft, setRevealSecondsLeft] = useState(0);
  const [revealArmed, setRevealArmed] = useState(false);
  const aiInFlightRef = useRef(false);
  const matchRef = useRef<MatchView | null>(null);

  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  useEffect(() => {
    if (!match) {
      setSelectedAttackerId(null);
      setActionFeedback(null);
      return;
    }

    if (match.phase !== "player_turn") {
      setSelectedAttackerId(null);
      setActionFeedback(null);
    }
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
        const next = await postJson<MatchView>(`/api/match/${current.matchId}/reveal/complete`, { confirmed: true }, token);
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
    // AI auto-move only fires for the solo-vs-Claude mode. PVP never enters
    // "ai_turn" phase (both turns are player_turn) so this is doubly safe.
    if (!match || match.phase !== "ai_turn" || match.mode === "pvp" || aiInFlightRef.current) {
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

  // PVP: load the initial match state for an attached lobby match.
  useEffect(() => {
    if (!initialMatchId || !token || matchRef.current) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const view = await getJson<MatchView>(`/api/match/${initialMatchId}`, token);
        if (!cancelled) setMatch(view);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load match.");
      }
    })();
    return () => { cancelled = true; };
  }, [initialMatchId, token]);

  // PVP: poll for opponent moves while it is not your turn or while waiting on a tie repick.
  useEffect(() => {
    if (!match || match.mode !== "pvp" || !token) {
      return undefined;
    }
    const myTurn = match.viewer === match.currentTurn;
    const waitingForOpponentRepick =
      match.phase === "repick" &&
      match.repick?.picksReceived?.includes(match.viewer === "player" ? "attacker" : "defender") &&
      (match.repick.picksReceived?.length ?? 0) < 2;
    const shouldPoll =
      match.phase === "finished" ||
      !myTurn ||
      waitingForOpponentRepick ||
      match.phase === "reveal" ||
      match.rematch?.status === "pending";
    if (!shouldPoll) {
      return undefined;
    }
    const interval = window.setInterval(async () => {
      try {
        const view = await getJson<MatchView>(`/api/match/${match.matchId}`, token);
        setMatch(view);
      } catch (cause) {
        // Ignore transient errors during polling.
        void cause;
      }
    }, 1500);
    return () => window.clearInterval(interval);
  }, [match, token]);

  const boardCells = useMemo(() => {
    // CRITICAL: only alive pieces occupy a cell. Dead pieces remain in the
    // board payload (with alive=false) at their grave coordinates. If we let
    // them into the lookup map, an alive piece sharing the same (row,col)
    // could be overwritten by the corpse depending on iteration order, which
    // looked like pieces "switching" or "cloning" to the user.
    const lookup = new Map<string, VisiblePiece>();
    (match?.board ?? [])
      .filter((piece) => piece.alive)
      .forEach((piece) => {
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

  const viewerOwner: Owner = match?.viewer ?? "player";
  const isMyTurn = match ? match.currentTurn === viewerOwner : false;

  const legalMoveTargets = useMemo(() => {
    if (!match || match.phase !== "player_turn" || !selectedAttackerId || !isMyTurn) {
      return new Set<string>();
    }

    const selectedPiece = match.board.find((piece) => piece.id === selectedAttackerId);
    if (!selectedPiece || selectedPiece.owner !== viewerOwner || !selectedPiece.alive) {
      return new Set<string>();
    }

    const occupied = new Set(
      match.board.filter((piece) => piece.alive).map((piece) => `${piece.row}-${piece.col}`),
    );
    // Player advances toward the enemy: row +1 for owner=player (viewing up),
    // row -1 for owner=ai (player 2 advances downward toward player 1).
    const forwardDelta = selectedPiece.owner === "player" ? 1 : -1;
    const candidates: Array<[number, number]> = [
      [selectedPiece.row + forwardDelta, selectedPiece.col],
      [selectedPiece.row, selectedPiece.col - 1],
      [selectedPiece.row, selectedPiece.col + 1],
    ];

    return new Set(
      candidates
        .filter(([row, col]) => row >= 1 && row <= 6 && col >= 1 && col <= 5)
        .filter(([row, col]) => !occupied.has(`${row}-${col}`))
        .map(([row, col]) => `${row}-${col}`),
    );
  }, [match, selectedAttackerId, viewerOwner, isMyTurn]);

  const legalAttackTargets = useMemo(() => {
    if (!match || match.phase !== "player_turn" || !selectedAttackerId || !isMyTurn) {
      return new Set<string>();
    }

    const selectedPiece = match.board.find((piece) => piece.id === selectedAttackerId);
    if (!selectedPiece || selectedPiece.owner !== viewerOwner || !selectedPiece.alive) {
      return new Set<string>();
    }

    return new Set(
      match.board
        .filter(
          (piece) =>
            piece.alive &&
            piece.owner !== viewerOwner &&
            Math.abs(piece.row - selectedPiece.row) + Math.abs(piece.col - selectedPiece.col) === 1,
        )
        .map((piece) => piece.id),
    );
  }, [match, selectedAttackerId, viewerOwner, isMyTurn]);

  const phaseLabel = useMemo(() => {
    switch (match?.phase) {
      case "reveal":
        return "Weapon Reveal";
      case "player_turn":
        return isMyTurn ? "Player Turn" : "Opponent Turn";
      case "ai_turn":
        return "AI Turn";
      case "repick":
        return "Tie Repick";
      case "finished":
        return "Match Finished";
      default:
        return "Setup";
    }
  }, [match?.phase, isMyTurn]);

  const turnLabel = useMemo(() => {
    if (!match) {
      return "Waiting";
    }
    if (match.phase === "reveal") {
      return "Memorize the board";
    }
    if (match.phase === "finished") {
      return "Match over";
    }
    if (match.phase === "ai_turn") {
      return "Claude thinking";
    }
    if (match.phase === "repick") {
      return "Choose your repick";
    }
    return isMyTurn ? "Your move" : "Opponent move";
  }, [match, isMyTurn]);

  const selectedPiece = useMemo(
    () => match?.board.find((piece) => piece.id === selectedAttackerId) ?? null,
    [match, selectedAttackerId],
  );

  const actionHint = useMemo(() => {
    if (!match) {
      return "Start a match to begin.";
    }
    if (match.phase === "reveal") {
      return "Memorize enemy weapons before the countdown ends. The board is locked during reveal.";
    }
    if (match.phase === "ai_turn") {
      return "Claude is resolving its turn. Wait for the board to update.";
    }
    if (match.phase === "repick") {
      return "The duel tied. Pick a new weapon to continue the same clash.";
    }
    if (match.phase === "finished") {
      return "Review the result, then start another match.";
    }
    if (!selectedPiece) {
      return "Select one of your alive pieces. Front-row pieces can usually advance first.";
    }
    if (legalMoveTargets.size === 0 && legalAttackTargets.size === 0) {
      return "This piece is blocked. Open a lane with a different piece or wait for the board to change.";
    }
    if (legalAttackTargets.size > 0 && legalMoveTargets.size > 0) {
      return "This piece can either move into a highlighted blue cell or attack a highlighted enemy target.";
    }
    if (legalAttackTargets.size > 0) {
      return "This piece has an adjacent enemy. Attack one of the highlighted enemy targets.";
    }
    return "This piece can move into one of the highlighted blue cells.";
  }, [match, selectedPiece, legalMoveTargets, legalAttackTargets]);

  async function startMatch() {
    setLoading(true);
    setError(null);
    setActionFeedback(null);
    setSelectedAttackerId(null);
    try {
      const created = await postJson<MatchView>("/api/match/create", { difficulty: selectedDifficulty }, token);
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
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/reveal/complete`, { confirmed: true }, token);
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
    setActionFeedback(null);
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/turn/player-attack`, {
        attackerId: selectedAttackerId,
        targetId,
      }, token);
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
    setActionFeedback(null);
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/turn/player-move`, {
        pieceId: selectedAttackerId,
        row,
        col,
      }, token);
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
    setActionFeedback(null);
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/turn/tie-repick`, { weapon }, token);
      setMatch(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Repick failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitRematch(action: "accept" | "decline") {
    const current = matchRef.current;
    if (!current) {
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/rematch`, { action }, token);
      setMatch(next);
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Rematch request failed.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  function onPieceClick(piece: VisiblePiece) {
    if (!match) {
      return;
    }
    if (match.phase !== "player_turn" || !piece.alive || !isMyTurn) {
      setActionFeedback({
        tone: "warning",
        message: match?.phase === "reveal" ? "Board locked during reveal. Memorize positions until the timer ends." : "Wait for your turn before acting.",
      });
      return;
    }
    if (piece.owner === viewerOwner) {
      setSelectedAttackerId(piece.id);
      setError(null);
      setActionFeedback(null);
      return;
    }
    if (piece.owner !== viewerOwner && selectedAttackerId) {
      if (!legalAttackTargets.has(piece.id)) {
        setActionFeedback({
          tone: "warning",
          message: "Blocked: you can only duel an adjacent enemy target.",
        });
        return;
      }
      void attack(piece.id);
      return;
    }
    setActionFeedback({
      tone: "info",
      message: "Select one of your operatives first, then choose an adjacent enemy to duel.",
    });
  }

  function onEmptyCellClick(row: number, col: number) {
    if (!selectedAttackerId || match?.phase !== "player_turn" || !isMyTurn) {
      setActionFeedback({
        tone: "info",
        message: "Select one of your operatives to preview legal move lanes.",
      });
      return;
    }
    if (!legalMoveTargets.has(`${row}-${col}`)) {
      setActionFeedback({
        tone: "warning",
        message: `Blocked: move only to a highlighted adjacent empty square, not R${row} C${col}.`,
      });
      return;
    }
    void movePiece(row, col);
  }

  function resetToSetup() {
    setMatch(null);
    setSelectedAttackerId(null);
    setError(null);
    setActionFeedback(null);
    setLoading(false);
  }

  return {
    actionFeedback,
    boardCells,
    difficulties: DIFFICULTIES,
    error,
    actionHint,
    isMyTurn,
    loading,
    match,
    phaseLabel,
    legalMoveTargets,
    legalAttackTargets,
    onEmptyCellClick,
    onPieceClick,
    resetToSetup,
    revealSecondsLeft,
    selectedAttackerId,
    selectedPiece,
    selectedDifficulty,
    setSelectedDifficulty,
    startMatch,
    submitRepick,
    submitRematch,
    turnLabel,
    viewerOwner,
  };
}
