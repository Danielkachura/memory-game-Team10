import type { MatchView, Owner } from "../hooks/useGame";

type Phase = "setup" | "reveal" | "player_turn" | "ai_turn" | "repick" | "finished";

interface SidebarProps {
  phase: Phase;
  revealTimer: number;
  stats: MatchView["stats"];
  match: MatchView;
  difficulty: string;
  viewerOwner: Owner;
}

export function Sidebar({ phase, revealTimer, stats, match, difficulty, viewerOwner }: SidebarProps) {
  const isPvp = match.mode === "pvp";
  const isBlueViewer = viewerOwner === "ai";

  const myWins = isBlueViewer ? stats.playerDuelsLost : stats.playerDuelsWon;
  const myLosses = isBlueViewer ? stats.playerDuelsWon : stats.playerDuelsLost;

  const title = isPvp
    ? isBlueViewer
      ? "Blue Squad — Your View"
      : "Red Squad — Your View"
    : "Match Control";

  return (
    <aside className="panel" style={{ width: "280px" }}>
      <h2>{title}</h2>
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
      <p>Won: {myWins} Lost: {myLosses}</p>
    </aside>
  );
}
