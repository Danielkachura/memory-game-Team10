import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SquadBoard } from "../../modules/game/src/components/SquadBoard";
import type { VisiblePiece } from "../../modules/game/src/hooks/useGame";

function piece(id: string, owner: "player" | "ai", row: number, col: number, weapon: VisiblePiece["weapon"]): VisiblePiece {
  return {
    id,
    owner,
    row,
    col,
    alive: true,
    label: owner === "player" ? "Rock flag" : "Hidden Operative",
    weapon,
    weaponIcon: weapon ? weapon[0].toUpperCase() : null,
    role: owner === "player" ? "flag" : null,
    roleIcon: owner === "player" ? "F" : null,
    silhouette: owner === "ai",
  };
}

const cells = Array.from({ length: 6 }, (_, rowIndex) => 6 - rowIndex).flatMap((row) =>
  Array.from({ length: 5 }, (_, colIndex) => {
    const col = colIndex + 1;
    const boardPiece =
      row === 1 && col === 1
        ? piece("player-1", "player", row, col, "rock")
        : row === 6 && col === 1
          ? piece("ai-1", "ai", row, col, null)
          : null;
    return { row, col, piece: boardPiece };
  }),
);

describe("SquadBoard", () => {
  it("renders a 6 by 5 board from AI back row to player back row", () => {
    render(
      <SquadBoard
        cells={cells}
        phase="player_turn"
        selectedAttackerId="player-1"
        legalMoveTargets={new Set(["2-1"])}
        legalAttackTargets={new Set(["ai-1"])}
        onPieceClick={vi.fn()}
        onEmptyCellClick={vi.fn()}
      />,
    );

    const boardCells = screen.getAllByTestId("squad-board-cell");
    expect(boardCells).toHaveLength(30);
    expect(boardCells[0]).toHaveTextContent("R6 C1");
    expect(boardCells[29]).toHaveTextContent("R1 C5");
    expect(screen.getByLabelText(/Rock flag/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hidden Operative/i)).toHaveClass("unit-token--silhouette");
    expect(screen.getByLabelText(/Empty cell row 2 col 1/i)).toHaveTextContent("Move");
  });

  it("routes piece and empty-cell clicks", async () => {
    const user = userEvent.setup();
    const onPieceClick = vi.fn();
    const onEmptyCellClick = vi.fn();

    render(
      <SquadBoard
        cells={cells}
        phase="reveal"
        selectedAttackerId={null}
        legalMoveTargets={new Set(["2-1"])}
        legalAttackTargets={new Set()}
        onPieceClick={onPieceClick}
        onEmptyCellClick={onEmptyCellClick}
      />,
    );

    await user.click(screen.getByLabelText(/Rock flag/i));
    await user.click(screen.getByLabelText(/Empty cell row 2 col 1/i));

    expect(onPieceClick).toHaveBeenCalledWith(expect.objectContaining({ id: "player-1" }));
    expect(onEmptyCellClick).toHaveBeenCalledWith(2, 1);
  });
});
