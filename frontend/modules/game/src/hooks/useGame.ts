import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Piece, BoardCell, Phase, DuelSummary, MatchView, MatchStats, Difficulty, Weapon, Owner
} from "@shared/types";
import { BOARD_COLS, BOARD_ROWS } from "@shared/constants";
import { audioManager, JUMP_DURATION_MS } from "../utils/audioManager";

export type UiPhase = "WAITING_FOR_PLAYER" | "MOVING" | "BATTLE" | "GAME_OVER" | Phase;

export interface UseGameReturn {
  boardCells:        BoardCell[];
  match:             MatchView | null;
  phase:             Phase;
  uiPhase:           UiPhase;
  selectedPieceId:   string | null;
  movingPieceId:     string | null;
  validMoveSet:      Set<string>;
  error:             string | null;
  loading:           boolean;
  revealSecondsLeft: number;
  difficulties:      Array<{ id: Difficulty; label: string; detail: string }>;
  selectedDifficulty: Difficulty;
  showDuel:          boolean;
  dyingIds:          Set<string>;
  setSelectedDifficulty: (d: Difficulty) => void;
  onPieceClick:      (piece: Piece) => void;
  onCellClick:       (row: number, col: number) => void;
  startMatch:        () => Promise<void>;
  resetToSetup:      () => void;
  submitRepick:      (weapon: Weapon) => Promise<void>;
}

const DIFFICULTIES: Array<{ id: Difficulty; label: string; detail: string }> = [
  { id: "easy",   label: "Easy",   detail: "AI plays mostly random valid moves." },
  { id: "medium", label: "Medium", detail: "AI uses remembered reveals when possible." },
  { id: "hard",   label: "Hard",   detail: "AI pressures known favorable matchups." },
];

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method:  "POST",
    headers: { "content-type": "application/json" },
    body:    body === undefined ? "{}" : JSON.stringify(body),
  });
  if (!response.ok) {
    const fallback = await response.text();
    throw new Error(fallback || `Request failed with ${response.status}.`);
  }
  return response.json() as Promise<T>;
}

function computeValidMoves(piece: Piece, board: Piece[]): Array<{ row: number; col: number }> {
  const occupied = new Map(board.filter(p => p.alive).map(p => [`${p.row}-${p.col}`, p]));
  const dirs = [{ dr: 1, dc: 0 }, { dr: -1, dc: 0 }, { dr: 0, dc: 1 }, { dr: 0, dc: -1 }];
  return dirs
    .map(({ dr, dc }) => ({ row: piece.row + dr, col: piece.col + dc }))
    .filter(({ row, col }) => {
      if (row < 1 || row > BOARD_ROWS || col < 1 || col > BOARD_COLS) return false;
      const occ = occupied.get(`${row}-${col}`);
      return !occ || occ.owner === "ai";
    });
}

export function useGame(): UseGameReturn {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [match,              setMatch]              = useState<MatchView | null>(null);
  const [selectedPieceId,    setSelectedPieceId]    = useState<string | null>(null);
  const [movingPieceId,      setMovingPieceId]      = useState<string | null>(null);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState<string | null>(null);
  const [revealSecondsLeft,  setRevealSecondsLeft]  = useState(0);
  const [showDuel,           setShowDuel]           = useState(false);
  const [dyingIds,           setDyingIds]           = useState<Set<string>>(new Set());
  const aiInFlightRef = useRef(false);
  const matchRef      = useRef<MatchView | null>(null);

  useEffect(() => { matchRef.current = match; }, [match]);

  // ── Valid moves for selected piece ───────────────────────────────
  const validMoves = useMemo(() => {
    if (!match || !selectedPieceId || match.phase !== "player_turn") return [];
    const piece = match.board.find(p => p.id === selectedPieceId && p.alive);
    if (!piece || piece.owner !== "player") return [];
    return computeValidMoves(piece, match.board);
  }, [match, selectedPieceId]);

  const validMoveSet = useMemo(
    () => new Set(validMoves.map(m => `${m.row}-${m.col}`)),
    [validMoves],
  );

  // ── Reveal timer ─────────────────────────────────────────────────
  useEffect(() => {
    if (!match || match.phase !== "reveal") {
      setRevealSecondsLeft(0);
      return undefined;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil(match.revealEndsAt - Date.now() / 1000));
      setRevealSecondsLeft(remaining);
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [match]);

  useEffect(() => {
    if (!match || match.phase !== "reveal" || revealSecondsLeft > 0) return;
    void completeReveal();
  }, [match, revealSecondsLeft]);

  // ── Apply state with animation ───────────────────────────────────
  const applyState = useCallback((next: MatchView) => {
    if (next.duel && !next.duel.tie) {
      setMatch(prev => ({ ...next, board: prev?.board ?? next.board, phase: prev?.phase ?? next.phase }));
      setShowDuel(true);
      if (next.duel.eliminatedId) setDyingIds(new Set([next.duel.eliminatedId]));

      setTimeout(() => {
        setShowDuel(false);
        setMatch(next);
        setTimeout(() => setDyingIds(new Set()), 400);
      }, 2000);
    } else {
      setMatch(next);
      setShowDuel(next.phase === "repick");
    }
  }, []);

  // ── AI turn ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!match || match.phase !== "ai_turn" || aiInFlightRef.current || showDuel) return;
    aiInFlightRef.current = true;
    const timeout = window.setTimeout(async () => {
      const url = `/api/match/${match.matchId}/turn/ai-move`;
      try {
        const next = await postJson<MatchView>(url);
        applyState(next);
      } catch {
        // First attempt failed — retry once after a short pause before showing an error.
        await new Promise<void>(res => window.setTimeout(res, 600));
        try {
          const next = await postJson<MatchView>(url);
          applyState(next);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "AI move failed.");
        }
      } finally {
        aiInFlightRef.current = false;
      }
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [match, showDuel, applyState]);

  // ── Board cells ───────────────────────────────────────────────────
  const boardCells = useMemo(() => {
    const lookup = new Map<string, Piece>();
    // Only alive pieces occupy board squares; dead pieces must not ghost.
    (match?.board ?? []).filter(p => p.alive).forEach(p => lookup.set(`${p.row}-${p.col}`, p));
    const cells: BoardCell[] = [];
    for (let row = BOARD_ROWS; row >= 1; row -= 1) {
      for (let col = 1; col <= BOARD_COLS; col += 1) {
        cells.push({ row, col, piece: lookup.get(`${row}-${col}`) ?? null });
      }
    }
    return cells;
  }, [match]);

  // ── Actions ───────────────────────────────────────────────────────
  async function startMatch() {
    setLoading(true);
    setError(null);
    setSelectedPieceId(null);
    setDyingIds(new Set());
    try {
      const created = await postJson<MatchView>("/api/match/create", { difficulty: selectedDifficulty });
      setMatch(created);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect to game server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function completeReveal() {
    const current = matchRef.current;
    if (!current || current.phase !== "reveal") return;
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/reveal/complete`, { confirmed: true });
      setMatch(next);
    } catch (cause) {
      console.error("[useGame] completeReveal failed:", cause);
    }
  }

  async function movePiece(targetRow: number, targetCol: number) {
    const current = matchRef.current;
    if (!current || current.phase !== "player_turn" || !selectedPieceId) return;
    setLoading(true);
    setError(null);

    // Trigger jump animation + sound — fire before API call for instant feedback
    setMovingPieceId(selectedPieceId);
    audioManager.unlock();
    audioManager.playJump();
    window.setTimeout(() => setMovingPieceId(null), JUMP_DURATION_MS);

    try {
      const next = await postJson<MatchView>(
        `/api/match/${current.matchId}/turn/player-move`,
        { pieceId: selectedPieceId, targetRow, targetCol },
      );
      applyState(next);
      setSelectedPieceId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Move failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitRepick(weapon: Weapon) {
    const current = matchRef.current;
    if (!current || current.phase !== "repick") return;
    setLoading(true);
    setError(null);
    try {
      const next = await postJson<MatchView>(`/api/match/${current.matchId}/turn/tie-repick`, { weapon });
      applyState(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Repick failed.");
    } finally {
      setLoading(false);
    }
  }

  function onPieceClick(piece: Piece) {
    if (!match || showDuel || match.phase !== "player_turn" || !piece.alive) return;

    if (piece.owner === "player") {
      setSelectedPieceId(prev => prev === piece.id ? null : piece.id);
      return;
    }

    // Enemy piece — move there if it's a valid target
    if (piece.owner === "ai" && selectedPieceId && validMoveSet.has(`${piece.row}-${piece.col}`)) {
      void movePiece(piece.row, piece.col);
    }
  }

  function onCellClick(row: number, col: number) {
    if (!match || showDuel || match.phase !== "player_turn" || !selectedPieceId) return;
    if (!validMoveSet.has(`${row}-${col}`)) return;
    // Only handle empty cells here; piece clicks are handled by onPieceClick
    const occupant = match.board.find(p => p.alive && p.row === row && p.col === col);
    if (!occupant) void movePiece(row, col);
  }

  function resetToSetup() {
    setMatch(null);
    setSelectedPieceId(null);
    setMovingPieceId(null);
    setError(null);
    setLoading(false);
    setShowDuel(false);
    setDyingIds(new Set());
    audioManager.stopBgm();
  }

  const phase = match?.phase ?? "setup";

  const uiPhase: UiPhase = (() => {
    if (phase === "finished") return "GAME_OVER";
    if (showDuel)             return "BATTLE";
    if (movingPieceId)        return "MOVING";
    if (phase === "player_turn") return "WAITING_FOR_PLAYER";
    return phase;
  })();

  return {
    boardCells,
    match,
    phase,
    uiPhase,
    selectedPieceId,
    movingPieceId,
    validMoveSet,
    error,
    loading,
    revealSecondsLeft,
    difficulties:       DIFFICULTIES,
    selectedDifficulty,
    showDuel,
    dyingIds,
    setSelectedDifficulty,
    onPieceClick,
    onCellClick,
    startMatch,
    resetToSetup,
    submitRepick,
  };
}
