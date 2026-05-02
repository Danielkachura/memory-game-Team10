import { BoardCell, Piece } from "@shared/types";
import { NEUTRAL_ROWS } from "@shared/constants";
import { UnitSprite } from "./UnitSprite";

interface BoardCellProps {
  cell:          BoardCell;
  selected:      boolean;
  isValidMove:   boolean;
  isValidTarget: boolean;
  isRevealPhase: boolean;
  isDying:       boolean;
  isMoving:      boolean;
  onPieceClick:  (piece: Piece) => void;
  onCellClick:   (row: number, col: number) => void;
}

export function BoardCellComponent({
  cell, selected, isValidMove, isValidTarget, isRevealPhase, isDying, isMoving, onPieceClick, onCellClick,
}: BoardCellProps) {
  const isLight = (cell.row + cell.col) % 2 === 0;
  const neutral = (NEUTRAL_ROWS as readonly number[]).includes(cell.row);

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
        opacity:        neutral && !cell.piece ? 0.6 : 1,
        cursor:         isValidMove ? "pointer" : "default",
        outline:        isValidMove ? "2px inset rgba(100,220,100,0.35)" : undefined,
      }}
    >
      {cell.piece ? (
        <UnitSprite
          piece={cell.piece}
          selected={selected}
          isValidTarget={isValidTarget}
          isRevealPhase={isRevealPhase}
          isDying={isDying}
          isMoving={isMoving}
          onClick={() => onPieceClick(cell.piece!)}
        />
      ) : isValidMove ? (
        /* green dot on empty valid cells */
        <div
          style={{
            width:        "38%",
            height:       "38%",
            borderRadius: "50%",
            background:   "rgba(80, 210, 80, 0.75)",
            boxShadow:    "0 0 8px rgba(80,210,80,0.6)",
            animation:    "targetPulse 0.9s ease infinite",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
}
