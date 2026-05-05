import type { VisiblePiece } from "../hooks/useGame";

interface UnitTokenProps {
  piece: VisiblePiece;
  selected: boolean;
  isAttackTarget?: boolean;
  onClick: () => void;
}

const OWNER_SPRITE: Record<VisiblePiece["owner"], string> = {
  player: "/character_blue_idle_nobg.png",
  ai: "/character_red_idle_nobg.png",
};

export function UnitToken({ piece, selected, isAttackTarget = false, onClick }: UnitTokenProps) {
  const label = [piece.label, piece.weaponIcon, piece.roleIcon].filter(Boolean).join(" ");
  const className = [
    "unit-token",
    `unit-token--${piece.owner}`,
    selected ? "unit-token--selected" : "",
    piece.silhouette ? "unit-token--silhouette" : "",
    isAttackTarget ? "unit-token--attack-target" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      data-attackable={isAttackTarget ? "true" : undefined}
      onClick={onClick}
    >
      <img className="unit-token__sprite" src={OWNER_SPRITE[piece.owner]} alt={`${piece.owner} unit`} />
      {piece.weaponIcon ? <span className="unit-token__badge unit-token__badge--weapon">{piece.weaponIcon}</span> : null}
      {piece.roleIcon ? <span className="unit-token__badge unit-token__badge--role">{piece.roleIcon}</span> : null}
    </button>
  );
}
