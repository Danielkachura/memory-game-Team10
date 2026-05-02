import type { MatchView } from "../hooks/useGame";

type Phase = "setup" | "reveal" | "player_turn" | "ai_turn" | "repick" | "finished";

interface SidebarProps {
  phase: Phase;
  revealTimer: number;
  stats: MatchView["stats"];
  match: MatchView;
  difficulty: string;
}

export function Sidebar({ phase, revealTimer, stats, match, difficulty }: SidebarProps) {
  return (
    <aside className="panel" style={{ width: "280px" }}>
      <h2>Match Control</h2>
      <p>{match.message}</p>
      <div className="brief-status-grid">
        <div className="brief-status-card">
          <span className="brief-status-card__label">Phase</span>
          <strong>{phase}</strong>
        </div>
        <div className="brief-status-card">
          <span className="brief-status-card__label">Reveal</span>
          <strong>{revealTimer}s</strong>
        </div>
      </div>
      <p style={{ marginTop: 12 }}>Difficulty: {difficulty}</p>
      <p>Won: {stats.playerDuelsWon} Lost: {stats.playerDuelsLost}</p>
    </aside>
  );
}
