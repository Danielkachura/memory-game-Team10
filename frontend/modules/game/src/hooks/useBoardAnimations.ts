import { useEffect, useRef, useState } from "react";
import type { MatchView } from "./useGame";

export function useBoardAnimations(match: MatchView | null) {
  const [landingPieceId, setLandingPieceId] = useState<string | null>(null);
  const [movingPieceId, setMovingPieceId] = useState<string | null>(null);
  const [echoCells, setEchoCells] = useState<Set<string>>(new Set());
  const [justHiddenEnemyWeapons, setJustHiddenEnemyWeapons] = useState(false);
  const previousPositionsRef = useRef<Map<string, string>>(new Map());
  const previousAliveRef = useRef<Map<string, { alive: boolean; cell: string }>>(new Map());
  const previousPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (!match) {
      previousPositionsRef.current = new Map();
      return;
    }

    const timers: ReturnType<typeof window.setTimeout>[] = [];
    const nextPositions = new Map<string, string>();
    for (const piece of match.board) {
      if (!piece.alive) continue;
      const position = `${piece.row}-${piece.col}`;
      nextPositions.set(piece.id, position);
      const previous = previousPositionsRef.current.get(piece.id);
      if (previous && previous !== position) {
        setMovingPieceId(piece.id);
        timers.push(window.setTimeout(() => {
          setMovingPieceId((current) => (current === piece.id ? null : current));
          setLandingPieceId(piece.id);
          timers.push(window.setTimeout(() => {
            setLandingPieceId((current) => (current === piece.id ? null : current));
          }, 280));
        }, 300));
      }
    }
    previousPositionsRef.current = nextPositions;

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [match]);

  useEffect(() => {
    if (!match) {
      previousAliveRef.current = new Map();
      previousPhaseRef.current = null;
      return;
    }

    const timers: ReturnType<typeof window.setTimeout>[] = [];

    if (previousPhaseRef.current === "reveal" && match.phase === "player_turn") {
      setJustHiddenEnemyWeapons(true);
      timers.push(window.setTimeout(() => setJustHiddenEnemyWeapons(false), 500));
    }
    previousPhaseRef.current = match.phase;

    const nextAlive = new Map<string, { alive: boolean; cell: string }>();
    for (const piece of match.board) {
      const cell = `${piece.row}-${piece.col}`;
      nextAlive.set(piece.id, { alive: piece.alive, cell });
      const previous = previousAliveRef.current.get(piece.id);
      if (previous?.alive && !piece.alive) {
        setEchoCells((current) => new Set(current).add(previous.cell));
        timers.push(window.setTimeout(() => {
          setEchoCells((current) => {
            const next = new Set(current);
            next.delete(previous.cell);
            return next;
          });
        }, 700));
      }
    }
    previousAliveRef.current = nextAlive;

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [match]);

  return {
    landingPieceId,
    movingPieceId,
    echoCells,
    justHiddenEnemyWeapons,
  };
}
