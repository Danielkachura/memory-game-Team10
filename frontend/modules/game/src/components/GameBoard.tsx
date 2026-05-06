import { BoardCell, Piece, Phase } from "@shared/types";
import { BOARD_COLS, BOARD_ROWS } from "@shared/constants";
import { BoardCellComponent } from "./BoardCell";

interface GameBoardProps {
  boardCells:      BoardCell[];
  selectedPieceId: string | null;
  selectablePieceIds: Set<string>;
  validMoveSet:    Set<string>;
  phase:           Phase;
  dyingIds:        Set<string>;
  movingPieceId:   string | null;
  onPieceClick:    (piece: Piece) => void;
  onCellClick:     (row: number, col: number) => void;
}

export function GameBoard({
  boardCells, selectedPieceId, selectablePieceIds, validMoveSet, phase, dyingIds, movingPieceId, onPieceClick, onCellClick,
}: GameBoardProps) {
  const isReveal = phase === "reveal";

  return (
    <div
      data-testid="game-board"
      style={{
        display:             "inline-grid",
        gridTemplateColumns: `repeat(${BOARD_COLS}, var(--cell-size))`,
        gridTemplateRows:    `repeat(${BOARD_ROWS}, var(--cell-size))`,
        border:              "1px solid var(--color-board-border)",
        boxShadow:           "inset 0 2px 12px rgba(0,0,0,0.55), 0 8px 32px rgba(0,0,0,0.6)",
        position:            "relative",
        pointerEvents:       "auto",
      }}
    >
      {boardCells.map((cell) => {
        const piece         = cell.piece;
        const cellKey       = `${cell.row}-${cell.col}`;
        const isSelected    = piece?.id === selectedPieceId;
        const isSelectable  = !!piece && piece.owner === "player" && selectablePieceIds.has(piece.id);
        const isValidMove   = validMoveSet.has(cellKey);
        const isValidTarget = isValidMove && !!piece && piece.owner === "ai" && !!piece.alive;
        const isDying       = piece ? dyingIds.has(piece.id) : false;
        const isMoving      = piece ? piece.id === movingPieceId : false;

        return (
          <BoardCellComponent
            key={cellKey}
            cell={cell}
            selected={isSelected}
            isSelectable={isSelectable}
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
