import { UnitToken } from "./UnitToken";
import type { Phase, VisiblePiece } from "../hooks/useGame";

export interface SquadBoardCell {
  row: number;
  col: number;
  piece: VisiblePiece | null;
}

interface SquadBoardProps {
  cells: SquadBoardCell[];
  phase: Phase;
  selectedAttackerId: string | null;
  legalMoveTargets: Set<string>;
  legalAttackTargets: Set<string>;
  onPieceClick: (piece: VisiblePiece) => void;
  onEmptyCellClick: (row: number, col: number) => void;
}

export function SquadBoard({
  cells,
  phase,
  selectedAttackerId,
  legalMoveTargets,
  legalAttackTargets,
  onPieceClick,
  onEmptyCellClick,
}: SquadBoardProps) {
  return (
    <div className="nati-board-grid squad-board" data-testid="battle-board" aria-label="Squad RPS board">
      {cells.map((cell) => {
        const moveTarget = legalMoveTargets.has(`${cell.row}-${cell.col}`);
        const attackTarget = cell.piece ? legalAttackTargets.has(cell.piece.id) : false;
        const selected = cell.piece?.id === selectedAttackerId;
        const ownerTone =
          cell.row >= 5 ? "nati-board-cell--aiZone" : cell.row <= 2 ? "nati-board-cell--playerZone" : "nati-board-cell--neutralZone";

        return (
          <div
            key={`${cell.row}-${cell.col}`}
            className={`nati-board-cell ${ownerTone} ${moveTarget ? "nati-board-cell--move" : ""} ${attackTarget ? "nati-board-cell--attack" : ""}`}
            data-testid="squad-board-cell"
          >
            <span className="nati-board-cell__coords">{`R${cell.row} C${cell.col}`}</span>
            {cell.piece ? (
              <>
                <UnitToken
                  piece={cell.piece}
                  selected={selected}
                  isAttackTarget={attackTarget}
                  onClick={() => onPieceClick(cell.piece as VisiblePiece)}
                />
                <span className="nati-piece-label">{cell.piece.silhouette && phase !== "reveal" ? "Enemy silhouette" : cell.piece.label}</span>
              </>
            ) : (
              <button
                type="button"
                className={`nati-empty-target ${moveTarget ? "nati-empty-target--active" : ""}`}
                aria-label={`Empty cell row ${cell.row} col ${cell.col}`}
                onClick={() => onEmptyCellClick(cell.row, cell.col)}
              >
                {moveTarget ? "Move" : ""}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
