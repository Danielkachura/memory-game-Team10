import type { Owner, Phase } from "../hooks/useGame";

interface RefereePanelProps {
  phase: Phase;
  currentTurn: Owner | "none";
  showDuel: boolean;
  result: { winner: Owner; reason: string } | null;
}

export function RefereePanel({ phase, currentTurn, showDuel, result }: RefereePanelProps) {
  const label =
    result ? (result.winner === "player" ? "You win!" : "AI wins!") : showDuel ? "Battle!" : phase === "reveal" ? "Reveal" : currentTurn === "player" ? "Red move" : "Blue move";
  return (
    <div
      aria-label={`Referee: ${label}`}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", userSelect: "none", pointerEvents: "none" }}
    >
      <div
        title={label}
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          backgroundImage: "url('/referee_flags_matrix.png')",
          backgroundSize: "300% 300%",
          backgroundPosition: showDuel ? "33.33% 0%" : currentTurn === "player" ? "0% 50%" : "33.33% 50%",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
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
