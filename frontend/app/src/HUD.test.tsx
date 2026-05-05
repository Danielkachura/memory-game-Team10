import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HUD } from "../../modules/game/src/components/HUD";

describe("HUD", () => {
  it("shows phase, turn, reveal countdown, difficulty, and duel stats", () => {
    render(
      <HUD
        phaseLabel="Weapon Reveal"
        turnLabel="Memorize the board"
        revealSecondsLeft={9}
        difficulty="medium"
        stats={{ durationSeconds: 3, playerDuelsWon: 2, playerDuelsLost: 1, tieSequences: 0, decoyAbsorbed: 0 }}
      />,
    );

    expect(screen.getByText("Weapon Reveal")).toBeInTheDocument();
    expect(screen.getByText("Memorize the board")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
    expect(screen.getByText("W 2 / L 1")).toBeInTheDocument();
  });

  it("hides the countdown outside reveal", () => {
    render(
      <HUD
        phaseLabel="Player Turn"
        turnLabel="Your move"
        revealSecondsLeft={0}
        difficulty="hard"
        stats={{ durationSeconds: 3, playerDuelsWon: 0, playerDuelsLost: 0, tieSequences: 0, decoyAbsorbed: 0 }}
      />,
    );

    expect(screen.queryByText("Reveal")).not.toBeInTheDocument();
  });
});
