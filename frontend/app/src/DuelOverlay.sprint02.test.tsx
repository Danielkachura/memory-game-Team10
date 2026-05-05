import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DuelOverlay } from "../../modules/game/src/components/DuelOverlay";

describe("DuelOverlay Sprint 02 regression", () => {
  it("renders a full duel object without crashing and routes weapon art by unit id", () => {
    render(
      <DuelOverlay
        visible
        duel={{
          attackerId: "player-123",
          attackerName: "Rock Soldier",
          attackerWeapon: "rock",
          defenderId: "ai-456",
          defenderName: "Scissors Flag",
          defenderWeapon: "scissors",
          winner: "attacker",
          tie: false,
          decoyAbsorbed: false,
        }}
      />,
    );

    expect(screen.getByAltText("rock")).toHaveAttribute("src", "/character_red_rock_nobg.png");
    expect(screen.getByAltText("scissors")).toHaveAttribute("src", "/character_blue_scissors_nobg.png");
  });

  it("declares attackerId and defenderId in the local DuelSummary interface", () => {
    const source = readFileSync(resolve(__dirname, "../../modules/game/src/components/DuelOverlay.tsx"), "utf8");
    const interfaceBody = source.match(/interface DuelSummary \{(?<body>[\s\S]*?)\}/)?.groups?.body ?? "";

    expect(interfaceBody).toContain("attackerId: string");
    expect(interfaceBody).toContain("defenderId: string");
  });
});
