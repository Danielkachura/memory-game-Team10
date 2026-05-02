interface PlayerNameLabelProps {
  name: string;
  team: "ai" | "player";
}

export function PlayerNameLabel({ name, team }: PlayerNameLabelProps) {
  const color = team === "player" ? "var(--color-danger)" : "var(--color-primary)";
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
