import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UnitToken } from "../../modules/game/src/components/UnitToken";
import type { VisiblePiece } from "../../modules/game/src/hooks/useGame";

function piece(overrides: Partial<VisiblePiece> = {}): VisiblePiece {
  return {
    id: "player-1",
    owner: "player",
    row: 2,
    col: 3,
    alive: true,
    label: "Rock flag",
    weapon: "rock",
    weaponIcon: "R",
    role: "flag",
    roleIcon: "F",
    silhouette: false,
    ...overrides,
  };
}

describe("UnitToken", () => {
  it("renders owner sprite plus visible weapon and own role overlays", () => {
    render(<UnitToken piece={piece()} selected={false} onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Rock flag R F/i })).toBeInTheDocument();
    expect(screen.getByAltText("player unit")).toHaveAttribute("src", "/character_blue_idle_nobg.png");
    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("uses red silhouette styling for hidden enemy pieces and marks selected pieces", () => {
    render(
      <UnitToken
        piece={piece({
          id: "ai-1",
          owner: "ai",
          label: "Hidden Operative",
          weapon: null,
          weaponIcon: null,
          role: null,
          roleIcon: null,
          silhouette: true,
        })}
        selected
        onClick={vi.fn()}
      />,
    );

    const token = screen.getByRole("button", { name: /Hidden Operative/i });
    expect(token).toHaveClass("unit-token--selected");
    expect(token).toHaveClass("unit-token--silhouette");
    expect(screen.getByAltText("ai unit")).toHaveAttribute("src", "/character_red_idle_nobg.png");
  });
});
