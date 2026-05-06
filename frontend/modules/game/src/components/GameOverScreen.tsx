import { MatchStats, Difficulty, Owner } from "@shared/types";

interface GameOverScreenProps {
  result:      { winner: Owner; reason: string };
  stats:       MatchStats;
  difficulty:  Difficulty;
  onPlayAgain: () => void;
}

export function GameOverScreen({ result, stats, difficulty, onPlayAgain }: GameOverScreenProps) {
  const playerWins = result.winner === "player";
  const totalDuels = stats.playerDuelsWon + stats.playerDuelsLost;
  const winRate = totalDuels > 0
    ? Math.round((stats.playerDuelsWon / totalDuels) * 100)
    : 0;

  return (
    <div
      className="game-over-overlay"
      style={{
        position:       "absolute",
        inset:          0,
        background:     "rgba(0,0,0,0.88)",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            "18px",
        zIndex:         200,
        borderRadius:   "2px",
      }}
    >
      {/* Winner/loser image */}
      <img
        src={playerWins ? "/character_red_trophy_nobg.png" : "/character_yellow_fallen_nobg.png"}
        alt={playerWins ? "trophy" : "fallen"}
        style={{ width: "130px", height: "130px", objectFit: "contain" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />

      {/* Result */}
      <div style={{
        fontFamily:   "var(--font-heading)",
        fontSize:     "3rem",
        fontStyle:    "italic",
        color:        playerWins ? "var(--color-success)" : "var(--color-danger)",
        textShadow:   "3px 3px 0 rgba(0,0,0,0.8)",
        letterSpacing: "4px",
      }}>
        {playerWins ? "YOU WIN!" : "YOU LOSE!"}
      </div>

      <div style={{
        fontFamily: "var(--font-body)",
        fontSize:   "0.9rem",
        color:      "var(--color-text-muted)",
        textAlign:  "center",
      }}>
        {result.reason}
        &nbsp;·&nbsp;
        <span style={{ color: "var(--color-warning)", textTransform: "capitalize" }}>{difficulty}</span> mode
      </div>

      {/* Stats grid */}
      <div style={{
        display:             "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap:                 "10px",
        width:               "100%",
        maxWidth:            "380px",
        padding:             "12px",
        background:          "rgba(0,0,0,0.4)",
        borderRadius:        "var(--radius-md)",
      }}>
        {[
          { label: "Total Duels",   value: totalDuels,              color: "var(--color-text)" },
          { label: "Duels Won",     value: stats.playerDuelsWon,    color: "var(--color-success)" },
          { label: "Duels Lost",    value: stats.playerDuelsLost,   color: "var(--color-danger)" },
          { label: "Win Rate",      value: `${winRate}%`,           color: "var(--color-logo-text)" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "1.5rem",
              fontWeight: "bold",
              color:      s.color,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: "var(--font-ui)",
              fontSize:   "0.62rem",
              color:      "var(--color-text-muted)",
              marginTop:  "2px",
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Gold trophy if win */}
      {playerWins && (
        <img
          src="/trophy_gold_nobg.png"
          alt="trophy"
          style={{ width: "60px", height: "60px", objectFit: "contain", opacity: 0.9 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}

      {/* Play Again */}
      <button
        type="button"
        onClick={onPlayAgain}
        style={{
          fontFamily:    "var(--font-heading)",
          fontSize:      "1.4rem",
          letterSpacing: "2px",
          padding:       "14px 48px",
          background:    "var(--color-logo-text)",
          color:         "#1a3a00",
          border:        "3px solid #8aaa00",
          borderRadius:  "var(--radius-md)",
          cursor:        "pointer",
          boxShadow:     "0 4px 14px rgba(0,0,0,0.5)",
          transition:    "transform 0.1s, box-shadow 0.1s",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.transform  = "scale(1.06)";
          (e.target as HTMLButtonElement).style.boxShadow = "0 6px 22px rgba(0,0,0,0.6)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.transform  = "scale(1)";
          (e.target as HTMLButtonElement).style.boxShadow = "0 4px 14px rgba(0,0,0,0.5)";
        }}
      >
        ▶ PLAY AGAIN
      </button>
    </div>
  );
}
