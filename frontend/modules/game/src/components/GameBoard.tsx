import { BoardCell, Piece, Phase } from "@shared/types";
import { BOARD_COLS } from "@shared/constants";
import { BoardCellComponent } from "./BoardCell";

interface GameBoardProps {
  boardCells:      BoardCell[];
  selectedPieceId: string | null;
  validMoveSet:    Set<string>;
  phase:           Phase;
  dyingIds:        Set<string>;
  movingPieceId:   string | null;
  onPieceClick:    (piece: Piece) => void;
  onCellClick:     (row: number, col: number) => void;
}

export function GameBoard({
  boardCells, selectedPieceId, validMoveSet, phase, dyingIds, movingPieceId, onPieceClick, onCellClick,
}: GameBoardProps) {
  const isReveal = phase === "reveal";

  return (
    <div
      data-testid="game-board"
      style={{
        display:             "inline-grid",
        gridTemplateColumns: `repeat(${BOARD_COLS}, var(--cell-size))`,
        gridTemplateRows:    "repeat(6, var(--cell-size))",
        border:              "4px solid var(--color-board-border)",
        boxShadow:           "0 6px 24px rgba(0,0,0,0.6)",
      }}
    >
      {boardCells.map((cell) => {
        const piece         = cell.piece;
        const cellKey       = `${cell.row}-${cell.col}`;
        const isSelected    = piece?.id === selectedPieceId;
        const isValidMove   = validMoveSet.has(cellKey);
        const isValidTarget = isValidMove && !!piece && piece.owner === "ai" && !!piece.alive;
        const isDying       = piece ? dyingIds.has(piece.id) : false;
        const isMoving      = piece ? piece.id === movingPieceId : false;

        return (
          <BoardCellComponent
            key={cellKey}
            cell={cell}
            selected={isSelected}
            isValidMove={isValidMove && !piece}
            isValidTarget={isValidTarget}
            isRevealPhase={isReveal}
            isDying={isDying}
            isMoving={isMoving}
            onPieceClick={onPieceClick}
            onCellClick={onCellClick}
          />
        );
      })}
    </div>
  );
}
