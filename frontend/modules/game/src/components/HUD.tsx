import type { Difficulty, MatchView } from "../hooks/useGame";

interface HUDProps {
  phaseLabel: string;
  turnLabel: string;
  revealSecondsLeft: number;
  difficulty: Difficulty;
  stats: MatchView["stats"];
}

export function HUD({ phaseLabel, turnLabel, revealSecondsLeft, difficulty, stats }: HUDProps) {
  return (
    <div className="hud-bar" aria-label="Match status">
      <div className="hud-bar__item">
        <span className="hud-label">Phase</span>
        <strong>{phaseLabel}</strong>
      </div>
      <div className="hud-bar__item">
        <span className="hud-label">Turn</span>
        <strong aria-live="polite">{turnLabel}</strong>
      </div>
      {revealSecondsLeft > 0 ? (
        <div className="hud-bar__item hud-bar__item--countdown">
          <span className="hud-label">Reveal</span>
          <strong>{revealSecondsLeft}</strong>
        </div>
      ) : null}
      <div className="hud-bar__item">
        <span className="hud-label">Difficulty</span>
        <strong className="hud-bar__badge">{difficulty}</strong>
      </div>
      <div className="hud-bar__item">
        <span className="hud-label">Duels</span>
        <strong>{`W ${stats.playerDuelsWon} / L ${stats.playerDuelsLost}`}</strong>
      </div>
    </div>
  );
}
