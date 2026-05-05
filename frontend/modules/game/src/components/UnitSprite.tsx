import type { CSSProperties } from "react";
import type { VisiblePiece, Weapon } from "../hooks/useGame";

interface UnitSpriteProps {
  piece: VisiblePiece;
  selected: boolean;
  isValidTarget: boolean;
  isRevealPhase: boolean;
  isDying: boolean;
  isMoving?: boolean;
  isLanding?: boolean;
  justHidden?: boolean;
  swayOffset?: number;
  onClick: () => void;
}

const PLAYER_IMG: Record<Weapon, string> = {
  rock: "/character_red_rock_nobg.png",
  paper: "/character_red_paper_nobg.png",
  scissors: "/character_red_scissors_nobg.png",
};

const CPU_IMG: Record<Weapon, string> = {
  rock: "/character_blue_idle_nobg.png",
  paper: "/character_blue_idle_nobg.png",
  scissors: "/character_blue_scissors_nobg.png",
};

const PLAYER_FLAG_IMG = "/character_red_flag_nobg.png";
const PLAYER_IDLE_IMG = "/character_red_idle_nobg.png";
const CPU_HIDDEN_IMG = "/character_blue_front_nobg.png";
const CPU_FLAG_IMG = "/character_blue_flag_nobg.png";
const CPU_IDLE_IMG = "/character_blue_idle_nobg.png";

const WEAPON_ICON: Record<Weapon, string> = {
  rock: "/rock_nobg.png",
  paper: "/paper_flat_nobg.png",
  scissors: "/scissors_nobg.png",
};

function getSrc(piece: VisiblePiece): string {
  if (piece.owner === "player") {
    if (piece.role === "flag") return PLAYER_FLAG_IMG;
    return (piece.weapon && PLAYER_IMG[piece.weapon]) ?? PLAYER_IDLE_IMG;
  }
  if (piece.silhouette) return CPU_HIDDEN_IMG;
  if (piece.role === "flag") return CPU_FLAG_IMG;
  return (piece.weapon && CPU_IMG[piece.weapon]) ?? CPU_IDLE_IMG;
}

const JUMP_SHEET: Record<string, string> = {
  player: "/hero_red_jump_sprites.png",
  ai: "/hero_blue_jump_sprites.jpg",
};

export function UnitSprite({
  piece,
  selected,
  isValidTarget,
  isRevealPhase,
  isDying,
  isMoving = false,
  isLanding = false,
  justHidden = false,
  swayOffset = 0,
  onClick,
}: UnitSpriteProps) {
  const isPlayer = piece.owner === "player";
  const showWeapon = !isDying && (piece.owner === "player" || isRevealPhase || !piece.silhouette);
  const showRoleBadge = !piece.alive && !piece.silhouette && (piece.role === "flag" || piece.role === "decoy");
  const roleFlag = showRoleBadge && piece.role === "flag" ? (isPlayer ? "/flag_red_nobg.png" : "/flag_blue_nobg.png") : null;
  const revealedRoleTitle = !piece.alive && piece.role === "flag" ? "Revealed flag" : piece.role === "decoy" && !piece.alive ? "Revealed decoy" : null;
  const baseLabel = piece.silhouette ? "Enemy silhouette" : `${piece.label}${piece.weaponIcon ? ` ${piece.weaponIcon}` : ""}`;
  const stateLabel = selected ? " Selected operative." : isValidTarget ? " Adjacent legal duel target." : "";

  const outline = isValidTarget && !selected ? "3px solid var(--color-valid-target)" : "none";
  const className = [
    isDying ? "piece-dying" : "",
    selected ? "unit-selected" : "",
    isLanding ? "unit-landing" : "",
    !isDying && !isMoving && !selected && piece.owner === "player" && piece.alive ? "unit-idle-sway" : "",
  ].filter(Boolean).join(" ");
  const buttonStyle = {
    position: "relative",
    width: "var(--unit-size)",
    height: "var(--unit-size)",
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: isValidTarget ? "crosshair" : "pointer",
    outline,
    borderRadius: "var(--radius-sm)",
    transform: isValidTarget && !selected ? "scale(1.06)" : "scale(1)",
    transition: "transform var(--motion-fast), filter var(--motion-fast)",
    filter: isValidTarget && !selected
      ? "drop-shadow(0 0 8px var(--color-valid-target))"
      : isMoving
          ? "drop-shadow(0 4px 10px rgba(0,0,0,0.8)) brightness(1.2)"
          : "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
    animation: isDying ? "unitDie 0.5s ease forwards" : undefined,
    "--sway-offset": swayOffset,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={onClick}
      data-piece-id={piece.id}
      data-owner={piece.owner}
      aria-label={`${baseLabel}${stateLabel}`}
      aria-pressed={selected}
      className={className}
      data-attackable={isValidTarget ? "true" : "false"}
      style={buttonStyle}
    >
      {isMoving ? (
        <div
          className="hero-jump-sprite"
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: `url('${JUMP_SHEET[piece.owner]}')`,
          }}
        />
      ) : (
        <img
          src={isDying ? "/character_yellow_fallen_nobg.png" : getSrc(piece)}
          alt=""
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", transition: isDying ? "none" : undefined }}
        />
      )}

      {showWeapon && piece.weapon && WEAPON_ICON[piece.weapon] ? (
        <img
          src={WEAPON_ICON[piece.weapon]}
          alt={piece.weapon}
          className={justHidden ? "weapon-hiding" : undefined}
          draggable={false}
          style={{
            position: "absolute",
            bottom: "1px",
            right: "1px",
            width: "20px",
            height: "20px",
            objectFit: "contain",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
          }}
        />
      ) : null}

      {roleFlag ? (
        <img
          data-testid="role-badge"
          src={roleFlag}
          alt="Defeated flag"
          title={revealedRoleTitle ?? "flag"}
          draggable={false}
          style={{
            position: "absolute",
            top: "-5px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "16px",
            height: "16px",
            objectFit: "contain",
          }}
        />
      ) : null}

      {showRoleBadge && piece.role === "decoy" ? (
        <div
          data-testid="role-badge"
          role="img"
          aria-label="Defeated decoy"
          title={revealedRoleTitle ?? "Decoy"}
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "13px",
            height: "13px",
            background: "var(--color-decoy)",
            borderRadius: "2px",
            transform: "rotate(45deg)",
            border: "1.5px solid white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
          }}
        />
      ) : null}

      {isValidTarget && !selected ? (
        <div
          style={{
            position: "absolute",
            inset: "-4px",
            borderRadius: "var(--radius-sm)",
            border: "2px solid var(--color-valid-target)",
            animation: "targetPulse 0.8s ease infinite",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </button>
  );
}
