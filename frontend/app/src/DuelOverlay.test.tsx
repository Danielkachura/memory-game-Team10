import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DuelOverlay } from "../../modules/game/src/components/DuelOverlay";

describe("DuelOverlay", () => {
  it("routes weapon images by attacker and defender ids and shows revealed roles", () => {
    render(
      <DuelOverlay
        visible
        duel={{
          attackerId: "player-1",
          attackerName: "Rock soldier",
          attackerWeapon: "rock",
          defenderId: "ai-1",
          defenderName: "Scissors flag",
          defenderWeapon: "scissors",
          winner: "attacker",
          tie: false,
          decoyAbsorbed: false,
          revealedRole: "flag",
        }}
      />,
    );

    expect(screen.getByAltText("rock")).toHaveAttribute("src", "/character_red_rock_nobg.png");
    expect(screen.getByAltText("scissors")).toHaveAttribute("src", "/character_blue_scissors_nobg.png");
    expect(screen.getByText("Flag!")).toBeInTheDocument();
  });
});
