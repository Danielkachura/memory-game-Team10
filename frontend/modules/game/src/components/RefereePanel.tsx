import type { Owner, Phase } from "../hooks/useGame";

type RefereeState = "idle" | "red_turn" | "blue_turn" | "battle" | "player_wins" | "player_loses";

interface RefereePanelProps {
  phase: Phase;
  currentTurn: Owner | "none";
  showDuel: boolean;
  result: { winner: Owner } | null;
}

const FRAME: Record<RefereeState, { pos: string; anim?: string; dur?: string }> = {
  idle: { pos: "0% 0%" },
  red_turn: { pos: "0% 50%" },
  blue_turn: { pos: "33.33% 50%" },
  battle: { pos: "33.33% 0%", anim: "refBattle", dur: "0.4s infinite" },
  player_wins: { pos: "0% 0%", anim: "refCheerSprite", dur: "0.6s infinite" },
  player_loses: { pos: "0% 100%" },
};

const LABEL: Record<RefereeState, string> = {
  idle: "Referee",
  red_turn: "Red move",
  blue_turn: "Blue move",
  battle: "Battle!",
  player_wins: "You win!",
  player_loses: "AI wins!",
};

function deriveState({ currentTurn, showDuel, result }: RefereePanelProps): RefereeState {
  if (result) return result.winner === "player" ? "player_wins" : "player_loses";
  if (showDuel) return "battle";
  if (currentTurn === "player") return "red_turn";
  if (currentTurn === "ai") return "blue_turn";
  return "idle";
}

export function RefereePanel(props: RefereePanelProps) {
  const state = deriveState(props);
  const frame = FRAME[state];
  const label = LABEL[state];

  return (
    <div
      aria-label={`Referee: ${label}`}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", userSelect: "none", pointerEvents: "none" }}
    >
      <div
        key={state}
        className="referee-sprite"
        title={label}
        style={{
          width: "72px",
          height: "72px",
          backgroundPosition: frame.pos,
          animation: frame.anim ? `${frame.anim} ${frame.dur}` : "none",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
          transition: "background-position 0.1s steps(1)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "0.65rem",
          color: "var(--color-text-muted)",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}
