import { useEffect, useMemo, useState } from "react";
import { DuelOverlay } from "./DuelOverlay";
import { PlayerNameLabel } from "./PlayerNameLabel";
import { RefereePanel } from "./RefereePanel";
import { SettingsPanel } from "./SettingsPanel";
import { Sidebar } from "./Sidebar";
import { StartScreen } from "./StartScreen";
import { UnitSprite } from "./UnitSprite";
import { useAudio } from "../hooks/useAudio";
import { useGame, type MatchView, type UseGameOptions } from "../hooks/useGame";

interface GameScreenProps extends UseGameOptions {
  onExit?: () => void;
}

const DEBUG_LOG_STORAGE_KEY = "squad-rps-show-debug-log";

function buildDuelKey(match: MatchView | null) {
  if (!match?.duel) return null;
  const duel = match.duel;
  return [
    match.matchId,
    match.phase,
    duel.attackerId,
    duel.defenderId,
    duel.attackerWeapon,
    duel.defenderWeapon,
    duel.winner,
    duel.revealedRole ?? "",
  ].join("|");
}

export function GameScreen({ initialMatchId, token, onExit }: GameScreenProps) {
  const {
    actionFeedback,
    actionHint,
    boardCells,
    difficulties,
    error,
    isMyTurn,
    legalAttackTargets,
    legalMoveTargets,
    loading,
    match,
    onEmptyCellClick,
    onPieceClick,
    revealSecondsLeft,
    selectedAttackerId,
    selectedPiece,
    selectedDifficulty,
    setSelectedDifficulty,
    startMatch,
    submitRepick,
    turnLabel,
    viewerOwner,
  } = useGame({ initialMatchId, token });
  const [visibleDuelKey, setVisibleDuelKey] = useState<string | null>(null);
  const [showDebugLog, setShowDebugLog] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.localStorage.getItem(DEBUG_LOG_STORAGE_KEY) !== "false";
  });

  const duelKey = useMemo(() => buildDuelKey(match), [match]);
  const duelVisible = Boolean(match?.duel && visibleDuelKey && duelKey === visibleDuelKey);
  const topLabel = match?.players?.ai ?? (match?.mode === "pvp" ? "Blue Squad" : "Claude");
  const bottomLabel = match?.players?.player ?? "Red Squad";
  const boardStatus = actionFeedback ?? (error ? { tone: "warning" as const, message: error } : null);
  const attachedMatch = Boolean(initialMatchId && token);
  const viewerRepickRole =
    match?.phase === "repick" && match.duel
      ? match.duel.attackerId.startsWith(viewerOwner) ? "attacker" : "defender"
      : null;
  const waitingForOpponentRepick =
    match?.phase === "repick" &&
    match.mode === "pvp" &&
    Boolean(
      viewerRepickRole &&
        match.repick?.picksReceived?.includes(viewerRepickRole) &&
        (match.repick?.picksReceived?.length ?? 0) < 2,
    );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(DEBUG_LOG_STORAGE_KEY, String(showDebugLog));
  }, [showDebugLog]);

  useEffect(() => {
    if (!match?.duel || !duelKey) {
      setVisibleDuelKey(null);
      return;
    }

    if (waitingForOpponentRepick) {
      setVisibleDuelKey(null);
      return;
    }

    setVisibleDuelKey(duelKey);
    if (match.phase === "repick") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisibleDuelKey((current) => (current === duelKey ? null : current));
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [duelKey, match?.duel, match?.phase, waitingForOpponentRepick]);

  useAudio(
    match
      ? {
          phase: match.phase,
          currentTurn: match.currentTurn,
          duel: match.duel,
          result: match.result,
          showDuel: duelVisible,
        }
      : null,
  );

  if (!match && !attachedMatch) {
    return (
      <StartScreen
        difficulties={difficulties}
        selected={selectedDifficulty}
        onSelect={setSelectedDifficulty}
        onStart={() => void startMatch()}
        loading={loading}
      />
    );
  }

  if (!match) {
    return (
      <main className="squad-shell">
        <div className="squad-backdrop" />
        <div className="squad-layout">
          <section className="panel setup-panel">
            <p className="eyebrow">Connecting</p>
            <h1 className="hero-title">Loading match state...</h1>
            <p className="hero-copy">Waiting for the current lobby match to load from the backend.</p>
            {error ? <p className="status-error">{error}</p> : null}
            {onExit ? (
              <div className="difficulty-list">
                <button type="button" className="secondary-button" onClick={onExit}>
                  Back
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="squad-shell">
      <div className="squad-backdrop" />
      <div className="squad-layout squad-layout--boarded">
        <header className="squad-header">
          <div>
            <p className="eyebrow">Squad RPS - Team 10</p>
            <h1>Nati presentation with current match logic</h1>
            <p className="hero-copy">
              {match.message} {isMyTurn ? "Act on your highlighted options." : "Wait for the board to hand back control."}
            </p>
          </div>
          {onExit ? (
            <div className="header-actions">
              <SettingsPanel showDebugLog={showDebugLog} onShowDebugLogChange={setShowDebugLog} />
              <button type="button" className="secondary-button" onClick={onExit}>
                Back
              </button>
            </div>
          ) : (
            <div className="header-actions">
              <SettingsPanel showDebugLog={showDebugLog} onShowDebugLogChange={setShowDebugLog} />
            </div>
          )}
        </header>

        <section className="nati-match-layout">
          <section className="panel nati-board-panel">
            <div className="nati-board-header">
              <div>
                <span className="hud-label">Phase</span>
                <strong>{match.phase.replace(/_/g, " ")}</strong>
              </div>
              <div>
                <span className="hud-label">Turn</span>
                <strong>{turnLabel}</strong>
              </div>
              <RefereePanel phase={match.phase} currentTurn={match.currentTurn} showDuel={duelVisible} result={match.result} />
            </div>

            <PlayerNameLabel name={topLabel} team="ai" />

            <div className="board-legend">
              <span><strong>Blue cells:</strong> legal move</span>
              <span><strong>Rose cells:</strong> legal duel</span>
            </div>

            {match.phase === "reveal" ? (
              <>
                <p className="board-status__headline">Board locked during reveal.</p>
                <p className="board-status__hint">{revealSecondsLeft}s left</p>
              </>
            ) : null}

            <div className="nati-board-stage">
              <div className="nati-board-grid" data-testid="battle-board">
                {boardCells.map((cell) => {
                  const moveTarget = legalMoveTargets.has(`${cell.row}-${cell.col}`);
                  const attackTarget = cell.piece ? legalAttackTargets.has(cell.piece.id) : false;
                  const selected = cell.piece?.id === selectedAttackerId;
                  const ownerTone =
                    cell.row >= 5 ? "nati-board-cell--aiZone" : cell.row <= 2 ? "nati-board-cell--playerZone" : "nati-board-cell--neutralZone";

                  return (
                    <div
                      key={`${cell.row}-${cell.col}`}
                      className={`nati-board-cell ${ownerTone} ${moveTarget ? "nati-board-cell--move" : ""} ${attackTarget ? "nati-board-cell--attack" : ""}`}
                    >
                      <span className="nati-board-cell__coords">{`R${cell.row} C${cell.col}`}</span>
                      {cell.piece ? (
                        <>
                          <UnitSprite
                            piece={cell.piece}
                            selected={selected}
                            isValidTarget={attackTarget}
                            isRevealPhase={match.phase === "reveal"}
                            isDying={false}
                            isMoving={false}
                            onClick={() => onPieceClick(cell.piece!)}
                          />
                          <span className="nati-piece-label">{cell.piece.silhouette ? "Enemy silhouette" : cell.piece.label}</span>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={`nati-empty-target ${moveTarget ? "nati-empty-target--active" : ""}`}
                          aria-label={`Empty cell row ${cell.row} col ${cell.col}`}
                          onClick={() => onEmptyCellClick(cell.row, cell.col)}
                        >
                          {moveTarget ? "Move" : ""}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {match.duel ? (
                <DuelOverlay
                  duel={match.duel}
                  visible={duelVisible}
                  repick={match.phase === "repick"}
                  onRepick={match.phase === "repick" ? (weapon) => void submitRepick(weapon) : undefined}
                />
              ) : null}
            </div>

            <PlayerNameLabel name={bottomLabel} team="player" />

            {boardStatus ? (
              <p className={`action-feedback ${boardStatus.tone === "warning" ? "action-feedback--warning" : "action-feedback--info"}`}>
                {boardStatus.message}
              </p>
            ) : null}

            <div className="nati-brief-row">
              <div className="nati-brief-card">
                <span className="hud-label">Selected</span>
                <strong>{selectedPiece ? selectedPiece.label : "None"}</strong>
                <p>{selectedPiece ? `Owner: ${selectedPiece.owner}` : "Choose one of your visible operatives to act."}</p>
              </div>
              <div className="nati-brief-card">
                <span className="hud-label">Legal moves</span>
                <strong>{legalMoveTargets.size}</strong>
                <p>{actionHint}</p>
              </div>
              <div className="nati-brief-card">
                <span className="hud-label">Legal duels</span>
                <strong>{legalAttackTargets.size}</strong>
                <p>{viewerOwner === "player" ? "You are controlling the red squad." : "You are controlling the blue squad."}</p>
              </div>
            </div>

            {showDebugLog ? (
              <div className="panel debug-log-panel" data-testid="debug-log-panel">
                <h2 className="debug-log-panel__title">Debug Log</h2>
                {match.eventLog && match.eventLog.length > 0 ? (
                  <div className="debug-log">
                    {match.eventLog.slice().reverse().map((entry) => (
                      <div key={`${entry.turn}-${entry.message}`} className="debug-log__entry">
                        <div className="debug-log__meta">
                          <span className="debug-log__turn">Turn {entry.turn}</span>
                          <span className="debug-log__badge">Log</span>
                        </div>
                        <p>{entry.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No moves logged yet.</p>
                )}
              </div>
            ) : null}

            {match.result ? (
              <div className="panel result-panel result-panel--embedded" data-testid="result-panel">
                <h2>{match.result.winner === viewerOwner ? "Victory" : "Defeat"}</h2>
                <p>{match.result.reason}</p>
                <p>
                  Match duration: <strong>{match.stats.durationSeconds}s</strong>
                </p>
                <button type="button" className="primary-button" onClick={() => void startMatch()}>
                  Play Again
                </button>
              </div>
            ) : null}
          </section>

          <aside className="panel nati-sidebar-shell">
            <Sidebar phase={match.phase} revealTimer={revealSecondsLeft} stats={match.stats} match={match} difficulty={match.difficulty} />
          </aside>
        </section>
      </div>
    </main>
  );
}
