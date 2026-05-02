interface GameOverScreenProps {
  result: { winner: "player" | "ai"; reason: string };
  stats: {
    durationSeconds: number;
    playerDuelsWon: number;
    playerDuelsLost: number;
    tieSequences: number;
    decoyAbsorbed: number;
  };
  difficulty: string;
  onPlayAgain: () => void;
}

export function GameOverScreen({ result, stats, difficulty, onPlayAgain }: GameOverScreenProps) {
  return (
    <div className="panel" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.72)" }}>
      <div style={{ maxWidth: 420, padding: 24 }}>
        <h2>{result.winner === "player" ? "You win" : "AI wins"}</h2>
        <p>{result.reason}</p>
        <p>Difficulty: {difficulty}</p>
        <p>
          Won {stats.playerDuelsWon} / Lost {stats.playerDuelsLost} / Ties {stats.tieSequences}
        </p>
        <button type="button" className="primary-button" onClick={onPlayAgain}>
          Back to setup
        </button>
      </div>
    </div>
  );
}
