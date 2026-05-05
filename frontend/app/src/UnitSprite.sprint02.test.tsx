import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UnitSprite } from "../../modules/game/src/components/UnitSprite";
import type { VisiblePiece } from "../../modules/game/src/hooks/useGame";

function deadEnemy(overrides: Partial<VisiblePiece> = {}): VisiblePiece {
  return {
    id: "ai-dead",
    owner: "ai",
    row: 4,
    col: 2,
    alive: false,
    label: "Defeated unit flag",
    weapon: null,
    weaponIcon: null,
    role: "flag",
    roleIcon: "FLAG",
    silhouette: false,
    ...overrides,
  };
}

describe("UnitSprite Sprint 02 role reveal", () => {
  it("renders a role badge for defeated enemy flags and decoys", () => {
    render(
      <UnitSprite
        piece={deadEnemy()}
        selected={false}
        isValidTarget={false}
        isRevealPhase={false}
        isDying={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Defeated unit flag/i)).toBeInTheDocument();
    expect(screen.getByTitle("Revealed flag")).toBeInTheDocument();
  });
});
