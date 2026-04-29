import { useGame } from "../hooks/useGame";

const weaponButtons: Array<{ id: "rock" | "paper" | "scissors"; icon: string; label: string }> = [
  { id: "rock", icon: "🪨", label: "Rock" },
  { id: "paper", icon: "📄", label: "Paper" },
  { id: "scissors", icon: "✂️", label: "Scissors" },
];

function PieceButton({
  piece,
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
  selected: boolean;
  onClick: () => void;
}) {
  if (!piece) {
    return <div className="squad-cell squad-cell--empty" aria-hidden="true" />;
  }

  const label = piece.silhouette
    ? `${piece.owner === "ai" ? "Enemy" : "Ally"} silhouette`
    : `${piece.label} ${piece.weaponIcon ?? ""}`.trim();

  return (
    <button
      type="button"
      className={`squad-cell ${piece.owner === "player" ? "squad-cell--player" : "squad-cell--ai"} ${selected ? "squad-cell--selected" : ""}`}
      onClick={onClick}
      disabled={!piece.alive}
      aria-label={label}
      data-piece-owner={piece.owner}
      data-piece-id={piece.id}
    >
      <span className="squad-cell__name">{piece.label}</span>
      <span className="squad-cell__meta">
        {piece.roleIcon ? <span>{piece.roleIcon}</span> : null}
        {piece.weaponIcon ? <span>{piece.weaponIcon}</span> : piece.silhouette ? <span>⬢</span> : null}
      </span>
    </button>
  );
}

export function GameScreen() {
  const {
    boardCells,
    difficulties,
    error,
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
  } = useGame();

  const selectedAttacker = match?.board.find((piece) => piece.id === selectedAttackerId) ?? null;
  const hasLegalMoveTargets = legalMoveTargets.size > 0;

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
            <button type="button" className="primary-button" onClick={() => void startMatch()} disabled={loading}>
              {loading ? "Generating squads..." : "Start Match"}
            </button>
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
                <button type="button" className="secondary-button" onClick={resetToSetup}>
                  Back To Setup
                </button>
              </div>
            </header>

            <section className="hud-grid">
              <div className="panel hud-card">
                <span className="hud-label">Phase</span>
                <strong>{match.phase.replace("_", " ")}</strong>
                <p>{match.message}</p>
              </div>
              <div className="panel hud-card">
                <span className="hud-label">Turn</span>
                <strong>{match.currentTurn === "player" ? "Your move" : match.currentTurn === "ai" ? "Claude thinking" : "Match over"}</strong>
                <p>{match.phase === "reveal" ? `${revealSecondsLeft}s reveal left` : `Difficulty: ${match.difficulty}`}</p>
              </div>
              <div className="panel hud-card">
                <span className="hud-label">Stats</span>
                <strong>{match.stats.playerDuelsWon} won / {match.stats.playerDuelsLost} lost</strong>
                <p>{match.stats.tieSequences} tie loops, {match.stats.decoyAbsorbed} decoy absorbs</p>
              </div>
            </section>

            <section className="battle-grid">
              <div className="panel board-panel">
                <div className="board-legend">
                  <span>Rows 6-5: Claude squad</span>
                  <span>Rows 4-3: neutral battle zone</span>
                  <span>Rows 2-1: your squad</span>
                </div>
                <div className="board-grid" data-testid="battle-board">
                  {boardCells.map((cell) => (
                    <div key={`${cell.row}-${cell.col}`} className="board-slot">
                      <span className="board-slot__coords">{`R${cell.row} C${cell.col}`}</span>
                      {cell.piece ? (
                        <PieceButton
                          piece={cell.piece}
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
                          aria-label={`Empty cell row ${cell.row} col ${cell.col}`}
                          onClick={() => {
                            onEmptyCellClick(cell.row, cell.col);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar-stack">
                <div className="panel">
                  <h2>Command Brief</h2>
                  {selectedAttacker ? (
                    <p>
                      Selected piece: <strong>{selectedAttacker.label}</strong>. Move to a highlighted empty square,
                      or click an adjacent enemy silhouette to start a duel.
                    </p>
                  ) : (
                    <p>Select one of your alive operatives. Front-row pieces can advance first.</p>
                  )}
                  {selectedAttacker && !hasLegalMoveTargets ? (
                    <p>
                      This piece has no empty legal move right now. Back-row pieces start blocked until the front row
                      opens a lane.
                    </p>
                  ) : null}
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
                      <p>
                        <strong>{match.duel.attackerName}</strong> {match.duel.attackerWeapon} vs{" "}
                        <strong>{match.duel.defenderName}</strong> {match.duel.defenderWeapon}
                      </p>
                      <p>
                        {match.duel.tie
                          ? "Tie. Repick weapons to continue."
                          : match.duel.decoyAbsorbed
                            ? "The Decoy absorbed the hit and stayed on the board."
                            : match.duel.winner === "attacker"
                              ? "Attacker won the duel."
                              : "Defender won the duel."}
                      </p>
                      {match.duel.revealedRole ? <p>Revealed role: {match.duel.revealedRole}</p> : null}
                    </div>
                  ) : (
                    <p>No duel yet. The first clash will reveal both weapons for that exchange only.</p>
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
            {error ? <p className="status-error">{error}</p> : null}
          </>
        )}
      </div>
    </main>
  );
}
