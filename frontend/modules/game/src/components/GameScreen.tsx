import { useGame, type UseGameOptions } from "../hooks/useGame";

const weaponButtons: Array<{ id: "rock" | "paper" | "scissors"; icon: string; label: string }> = [
  { id: "rock", icon: "R", label: "Rock" },
  { id: "paper", icon: "P", label: "Paper" },
  { id: "scissors", icon: "S", label: "Scissors" },
];

function PieceButton({
  piece,
  attackable,
  selected,
  onClick,
}: {
  piece: {
    id: string;
    owner: "player" | "ai";
    alive: boolean;
    label: string;
    weaponIcon: string | null;
    roleIcon: string | null;
    silhouette: boolean;
  } | null;
  attackable: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  if (!piece) {
    return <div className="squad-cell squad-cell--empty" aria-hidden="true" />;
  }

  const label = piece.silhouette
    ? `${piece.owner === "ai" ? "Enemy" : "Ally"} silhouette`
    : `${piece.label} ${piece.weaponIcon ?? ""}`.trim();
  const stateLabel =
    selected ? " Selected operative." : attackable ? " Adjacent legal duel target." : "";

  return (
    <button
      type="button"
      className={`squad-cell ${piece.owner === "player" ? "squad-cell--player" : "squad-cell--ai"} ${selected ? "squad-cell--selected" : ""} ${attackable ? "squad-cell--attackTarget" : ""}`}
      onClick={onClick}
      disabled={!piece.alive}
      aria-label={`${label}${stateLabel}`}
      data-piece-owner={piece.owner}
      data-piece-id={piece.id}
      data-attackable={attackable ? "true" : "false"}
    >
      <span className="squad-cell__state">
        {selected ? "Selected" : attackable ? "Duel" : piece.owner === "player" ? "Your unit" : "Hidden enemy"}
      </span>
      <span className="squad-cell__name">{piece.label}</span>
      <span className="squad-cell__meta">
        {piece.roleIcon ? <span>{piece.roleIcon}</span> : null}
        {piece.weaponIcon ? <span>{piece.weaponIcon}</span> : piece.silhouette ? <span>?</span> : null}
      </span>
    </button>
  );
}

function formatPhaseLabel(phase: string) {
  return phase
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDebugTone(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("duel") || normalized.includes("tie")) return "debug-log__badge debug-log__badge--duel";
  if (normalized.includes("move")) return "debug-log__badge debug-log__badge--move";
  if (normalized.includes("reveal")) return "debug-log__badge debug-log__badge--reveal";
  if (normalized.includes("flag") || normalized.includes("win") || normalized.includes("lose")) {
    return "debug-log__badge debug-log__badge--result";
  }
  return "debug-log__badge";
}

function getDebugLabel(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("duel")) return "Duel";
  if (normalized.includes("tie")) return "Tie";
  if (normalized.includes("move")) return "Move";
  if (normalized.includes("reveal")) return "Reveal";
  if (normalized.includes("flag")) return "Flag";
  return "Log";
}

interface GameScreenProps extends UseGameOptions {
  onExit?: () => void;
}

export function GameScreen({ initialMatchId, token, onExit }: GameScreenProps) {
  const {
    actionFeedback,
    boardCells,
    difficulties,
    error,
    legalAttackTargets,
    legalMoveTargets,
    loading,
    match,
    onEmptyCellClick,
    onPieceClick,
    resetToSetup,
    revealSecondsLeft,
    selectedAttackerId,
    selectedDifficulty,
    setSelectedDifficulty,
    startMatch,
    submitRepick,
  } = useGame({ initialMatchId, token });

  const selectedAttacker = match?.board.find((piece) => piece.id === selectedAttackerId) ?? null;
  const hasLegalMoveTargets = legalMoveTargets.size > 0;
  const hasLegalAttackTargets = legalAttackTargets.size > 0;
  const phaseLabel = match ? formatPhaseLabel(match.phase) : "";
  const turnLabel = match
    ? match.currentTurn === "player"
      ? "Your turn"
      : match.currentTurn === "ai"
        ? "Claude thinking"
        : "Match over"
    : "";
  const revealProgress = match?.phase === "reveal" ? Math.max(0, Math.min(100, (revealSecondsLeft / 10) * 100)) : 0;
  const boardStatus = actionFeedback ?? (error ? { tone: "warning" as const, message: error } : null);

  return (
    <main className="squad-shell">
      <div className="squad-backdrop" />
      <div className="squad-layout">
        {!match ? (
          <section className="panel setup-panel">
            <p className="eyebrow">Squad RPS - Team 10</p>
            <h1 className="hero-title">Flag hunts, decoys, and hidden weapons.</h1>
            <p className="hero-copy">
              Memorize the enemy squad during the reveal, then duel your way to the hidden flag-bearer
              before Claude finds yours.
            </p>
            <div className="difficulty-list">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  type="button"
                  className={`difficulty-card ${selectedDifficulty === difficulty.id ? "difficulty-card--active" : ""}`}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                >
                  <span>{difficulty.label}</span>
                  <small>{difficulty.detail}</small>
                </button>
              ))}
            </div>
            <div className="difficulty-list">
              <button type="button" className="primary-button" onClick={() => void startMatch()} disabled={loading}>
                {loading ? "Generating squads..." : "Start Match"}
              </button>
              {onExit ? (
                <button type="button" className="secondary-button" onClick={onExit}>
                  Back to home
                </button>
              ) : null}
            </div>
            {error ? <p className="status-error">{error}</p> : null}
          </section>
        ) : (
          <>
            <header className="squad-header">
              <div>
                <p className="eyebrow">Squad RPS - Team 10</p>
                <h1>5 x 6 hidden-info squad battle</h1>
              </div>
              <div className="header-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    resetToSetup();
                    onExit?.();
                  }}
                >
                  Back To Setup
                </button>
              </div>
            </header>

            <section className="match-shell">
              <aside className="hud-aside">
                <div className={`panel hud-card hud-card--phase ${match.phase === "reveal" ? "hud-card--reveal" : ""}`}>
                  <span className="hud-label">Phase</span>
                  <strong>{phaseLabel}</strong>
                  <p className="hud-message">{match.message}</p>
                  <div className="hud-pill-row">
                    <span className={`hud-pill ${match.phase === "reveal" ? "hud-pill--active" : ""}`}>Reveal</span>
                    <span className={`hud-pill ${match.phase === "player_turn" ? "hud-pill--active" : ""}`}>Player Turn</span>
                    <span className={`hud-pill ${match.phase === "ai_turn" ? "hud-pill--active" : ""}`}>AI Turn</span>
                    <span className={`hud-pill ${match.phase === "repick" ? "hud-pill--active" : ""}`}>Repick</span>
                  </div>
                </div>
                <div className={`panel hud-card ${match.currentTurn === "player" ? "hud-card--activeTurn" : ""}`}>
                  <span className="hud-label">Turn</span>
                  <strong>{turnLabel}</strong>
                  {match.phase === "reveal" ? (
                    <div className="reveal-readout" aria-live="polite">
                      <div className="reveal-readout__top">
                        <span className="reveal-readout__label">Board locked</span>
                        <strong>{revealSecondsLeft}s left</strong>
                      </div>
                      <div className="reveal-meter" aria-hidden="true">
                        <span className="reveal-meter__fill" style={{ width: `${revealProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <p className="hud-message">Difficulty: {match.difficulty}</p>
                  )}
                </div>
                <div className="panel hud-card">
                  <span className="hud-label">Stats</span>
                  <strong>{match.stats.playerDuelsWon} won / {match.stats.playerDuelsLost} lost</strong>
                  <p className="hud-message">{match.stats.tieSequences} tie loops, {match.stats.decoyAbsorbed} decoy absorbs</p>
                </div>
              </aside>

              <section className="battle-grid">
                <div className="panel board-panel">
                  <div className="board-legend">
                    <span><strong>Warm rows 6-5:</strong> Claude squad</span>
                    <span><strong>Rows 4-3:</strong> neutral battle zone</span>
                    <span><strong>Cool rows 2-1:</strong> your squad</span>
                    <span><strong>Blue cells:</strong> legal move</span>
                    <span><strong>Rose cells:</strong> legal duel</span>
                  </div>
                  {boardStatus ? (
                    <p
                      className={`action-feedback ${boardStatus.tone === "warning" ? "action-feedback--warning" : "action-feedback--info"}`}
                      role="status"
                    >
                      {boardStatus.message}
                    </p>
                  ) : null}
                  <div className="board-grid" data-testid="battle-board">
                    {boardCells.map((cell) => (
                      <div key={`${cell.row}-${cell.col}`} className="board-slot">
                        <span className="board-slot__coords">{`R${cell.row} C${cell.col}`}</span>
                        {cell.piece ? (
                          <PieceButton
                            piece={cell.piece}
                            attackable={legalAttackTargets.has(cell.piece.id)}
                            selected={cell.piece.id === selectedAttackerId}
                            onClick={() => {
                              const piece = cell.piece;
                              if (piece) {
                                onPieceClick(piece);
                              }
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            className={`squad-cell squad-cell--empty squad-cell--emptyButton ${legalMoveTargets.has(`${cell.row}-${cell.col}`) ? "squad-cell--moveTarget" : ""}`}
                            aria-label={`Empty cell row ${cell.row} col ${cell.col}${legalMoveTargets.has(`${cell.row}-${cell.col}`) ? ". Legal move target." : ""}`}
                            onClick={() => {
                              onEmptyCellClick(cell.row, cell.col);
                            }}
                          >
                            {legalMoveTargets.has(`${cell.row}-${cell.col}`) ? (
                              <>
                                <span className="squad-cell__state squad-cell__state--move">Move</span>
                                <span className="squad-cell__moveLabel">Move Here</span>
                                <span className="squad-cell__moveMeta">Advance into R{cell.row} C{cell.col}</span>
                              </>
                            ) : (
                              <span className="squad-cell__emptyHint">Hold position</span>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sidebar-stack">
                  <div className="panel">
                    <h2>Command Brief</h2>
                    {selectedAttacker ? (
                      <>
                        <p>
                          Selected piece: <strong>{selectedAttacker.label}</strong>.
                        </p>
                        <div className="brief-status-grid">
                          <div className="brief-status-card brief-status-card--move">
                            <span className="brief-status-card__label">Legal moves</span>
                            <strong>{legalMoveTargets.size}</strong>
                            <p>Blue empty cells can be entered immediately.</p>
                          </div>
                          <div className="brief-status-card brief-status-card--attack">
                            <span className="brief-status-card__label">Legal duels</span>
                            <strong>{legalAttackTargets.size}</strong>
                            <p>Rose enemy cells can be attacked now.</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p>Select one of your alive operatives. Front-row pieces advance first and adjacent enemies become duel targets only after a selection.</p>
                    )}
                    {selectedAttacker && !hasLegalMoveTargets ? (
                      <p>
                        This piece has no empty legal move right now. Back-row pieces start blocked until the front row
                        opens a lane.
                      </p>
                    ) : null}
                    {selectedAttacker && !hasLegalAttackTargets ? <p>No adjacent duel is available from this position yet.</p> : null}
                    <ul className="brief-list">
                      <li>Reveal lasts 10 seconds.</li>
                      <li>The backend hides enemy weapons and roles after reveal.</li>
                      <li>Move front, left, or right into an empty square.</li>
                      <li>Duel only when your piece is adjacent to an enemy.</li>
                      <li>Flag death ends the match instantly.</li>
                      <li>Decoys never die when they are attacked.</li>
                    </ul>
                  </div>

                  <div className="panel" data-testid="duel-panel">
                    <h2>Latest Duel</h2>
                    {match.duel ? (
                      <div className="duel-summary">
                        <div className="duel-summary__header">
                          <span className={`duel-summary__result ${match.duel.tie ? "duel-summary__result--tie" : match.duel.winner === "attacker" ? "duel-summary__result--win" : "duel-summary__result--loss"}`}>
                            {match.duel.tie ? "Tie duel" : match.duel.winner === "attacker" ? "Attacker wins" : "Defender wins"}
                          </span>
                          {match.duel.decoyAbsorbed ? <span className="duel-summary__effect">Decoy absorbed</span> : null}
                        </div>
                        <div className="duel-summary__grid">
                          <div className="duel-summary__combatant">
                            <span className="duel-summary__label">Attacker</span>
                            <strong>{match.duel.attackerName}</strong>
                            <p>{match.duel.attackerWeapon}</p>
                          </div>
                          <div className="duel-summary__versus">vs</div>
                          <div className="duel-summary__combatant">
                            <span className="duel-summary__label">Defender</span>
                            <strong>{match.duel.defenderName}</strong>
                            <p>{match.duel.defenderWeapon}</p>
                          </div>
                        </div>
                        <div className="duel-summary__notes">
                          <p>
                            {match.duel.tie
                              ? "Tie. Pick a new weapon to continue."
                              : match.duel.decoyAbsorbed
                                ? "The defender stayed on the board because the decoy absorbed the hit."
                                : match.duel.winner === "attacker"
                                  ? "The attack connected and removed the defender."
                                  : "The defender won the exchange."}
                          </p>
                          {match.duel.revealedRole ? <p>Revealed role: <strong>{match.duel.revealedRole}</strong></p> : null}
                        </div>
                      </div>
                    ) : (
                      <p>No duel yet. The first clash will reveal both weapons for that exchange only.</p>
                    )}
                  </div>

                  <div className="panel" data-testid="debug-log-panel">
                    <h2>Debug Log</h2>
                    {match.eventLog && match.eventLog.length > 0 ? (
                      <div className="debug-log">
                        {match.eventLog.slice().reverse().map((entry) => (
                          <div key={`${entry.turn}-${entry.message}`} className="debug-log__entry">
                            <div className="debug-log__meta">
                              <span className="debug-log__turn">Turn {entry.turn}</span>
                              <span className={getDebugTone(entry.message)}>{getDebugLabel(entry.message)}</span>
                            </div>
                            <p>{entry.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No moves logged yet.</p>
                    )}
                  </div>

                  {match.phase === "repick" ? (
                    <div className="panel" data-testid="repick-panel">
                      <h2>Tie Repick</h2>
                      <p>Pick a new weapon for your operative. Claude will repick at the same time.</p>
                      <div className="repick-row">
                        {weaponButtons.map((weapon) => (
                          <button
                            key={weapon.id}
                            type="button"
                            className="secondary-button"
                            onClick={() => void submitRepick(weapon.id)}
                            disabled={loading}
                          >
                            {weapon.icon} {weapon.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {match.phase === "finished" && match.result ? (
                    <div className="panel result-panel" data-testid="result-panel">
                      <h2>{match.result.winner === "player" ? "You Win" : "You Lose"}</h2>
                      <p>{match.result.reason}</p>
                      <p>
                        Match duration: <strong>{match.stats.durationSeconds}s</strong>
                      </p>
                      <button type="button" className="primary-button" onClick={() => void startMatch()}>
                        Play Again
                      </button>
                    </div>
                  ) : null}
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
