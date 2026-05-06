import { BoardCell, Piece } from "@shared/types";
import { NEUTRAL_ROWS } from "@shared/constants";
import { UnitSprite } from "./UnitSprite";

interface BoardCellProps {
  cell:          BoardCell;
  selected:      boolean;
  isSelectable:  boolean;
  isValidMove:   boolean;
  isValidTarget: boolean;
  isRevealPhase: boolean;
  isDying:       boolean;
  isMoving:      boolean;
  onPieceClick:  (piece: Piece) => void;
  onCellClick:   (row: number, col: number) => void;
}

export function BoardCellComponent({
  cell, selected, isSelectable, isValidMove, isValidTarget, isRevealPhase, isDying, isMoving, onPieceClick, onCellClick,
}: BoardCellProps) {
  const isLight      = (cell.row + cell.col) % 2 === 0;
  const neutral      = (NEUTRAL_ROWS as readonly number[]).includes(cell.row);
  const isRevealPlayerPiece = isRevealPhase && cell.piece?.owner === "player" && cell.piece?.alive;
  const cursor = isValidMove
    ? "pointer"
    : isValidTarget
    ? "crosshair"
    : isRevealPlayerPiece
    ? "pointer"
    : isSelectable && !isRevealPhase
    ? "pointer"
    : "default";

  return (
    <div
      data-row={cell.row}
      data-col={cell.col}
      data-testid={`cell-r${cell.row}c${cell.col}`}
      onClick={isValidMove ? () => onCellClick(cell.row, cell.col) : undefined}
      style={{
        width:          "var(--cell-size)",
        height:         "var(--cell-size)",
        background:     isLight ? "var(--color-board-light)" : "var(--color-board-dark)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        opacity:        neutral && !cell.piece ? 0.55 : 1,
        cursor,
        pointerEvents:  "auto",
        outline:        isValidMove ? "2px inset rgba(255,215,0,0.4)" : undefined,
      }}
    >
      {cell.piece ? (
        <UnitSprite
          piece={cell.piece}
          selected={selected}
          isSelectable={isSelectable}
          isValidTarget={isValidTarget}
          isRevealPhase={isRevealPhase}
          isDying={isDying}
          isMoving={isMoving}
          onClick={() => onPieceClick(cell.piece!)}
        />
      ) : isValidMove ? (
        /* Gold dot on empty valid cells */
        <div
          style={{
            width:        "34%",
            height:       "34%",
            borderRadius: "50%",
            background:   "rgba(255, 215, 0, 0.7)",
            boxShadow:    "0 0 10px rgba(255,215,0,0.5)",
            animation:    "targetPulse 0.9s ease infinite",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
}
