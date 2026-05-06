interface PlayerNameLabelProps {
  name: string;
  team: "player" | "ai" | "cpu";
}

/**
 * PlayerNameLabel — team name displayed above (CPU) or below (Player) the board.
 * Styled like RPS Online: bold, arcade font, team color.
 */
export function PlayerNameLabel({ name, team }: PlayerNameLabelProps) {
  const color =
    team === "player" ? "var(--color-label-player)" : "var(--color-label-cpu)";

  return (
    <div
      data-testid={`label-${team}`}
      style={{
        textAlign: "center",
        fontFamily: "var(--font-body)",
        fontWeight: "bold",
        fontSize: "1.2rem",
        color,
        letterSpacing: "0.05em",
        padding: "6px 0",
        textShadow: "1px 1px 3px rgba(0,0,0,0.6)",
      }}
    >
      {name}
    </div>
  );
}
