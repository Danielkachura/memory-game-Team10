import { Piece } from "@shared/types";

interface UnitSpriteProps {
  piece:         Piece;
  selected:      boolean;
  isValidTarget: boolean;
  isRevealPhase: boolean;
  isDying:       boolean;
  isMoving?:     boolean;
  onClick:       () => void;
}

const PLAYER_IMG: Record<string, string> = {
  rock:     "/character_red_rock_nobg.png",
  paper:    "/character_red_paper_nobg.png",
  scissors: "/character_red_scissors_nobg.png",
  flag:     "/character_red_flag_nobg.png",
  idle:     "/character_red_idle_nobg.png",
};

const CPU_IMG: Record<string, string> = {
  hidden:   "/character_blue_front_nobg.png",
  rock:     "/character_blue_idle_nobg.png",
  paper:    "/character_blue_idle_nobg.png",
  scissors: "/character_blue_scissors_nobg.png",
  flag:     "/character_blue_flag_nobg.png",
  idle:     "/character_blue_idle_nobg.png",
};

const WEAPON_ICON: Record<string, string> = {
  rock:     "/rock_nobg.png",
  paper:    "/paper_flat_nobg.png",
  scissors: "/scissors_nobg.png",
};

function getSrc(piece: Piece): string {
  if (piece.owner === "player") {
    if (piece.role === "flag") return PLAYER_IMG.flag;
    return (piece.weapon && PLAYER_IMG[piece.weapon]) ?? PLAYER_IMG.idle;
  }
  // For AI pieces
  if (piece.silhouette) return CPU_IMG.hidden;
  if (piece.role === "flag") return CPU_IMG.flag;
  return (piece.weapon && CPU_IMG[piece.weapon]) ?? CPU_IMG.idle;
}

const JUMP_SHEET: Record<string, string> = {
  player: "/hero_red_jump_sprites.png",
  ai:     "/hero_blue_jump_sprites.jpg",
};

export function UnitSprite({
  piece, selected, isValidTarget, isRevealPhase, isDying, isMoving = false, onClick,
}: UnitSpriteProps) {
  const isPlayer   = piece.owner === "player";
  const showWeapon = !piece.silhouette && piece.weapon;

  let outline = "none";
  if (selected)       outline = "3px solid var(--color-selected)";
  else if (isValidTarget) outline = "3px solid var(--color-valid-target)";

  const roleFlag = piece.role === "flag"
    ? (isPlayer ? "/flag_red_nobg.png" : "/flag_blue_nobg.png")
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      data-piece-id={piece.id}
      data-owner={piece.owner}
      aria-label={`${isPlayer ? "Your" : "AI"} ${piece.role || "soldier"} ${piece.weapon || "hidden"} row ${piece.row} col ${piece.col}${selected ? ", selected" : ""}`}
      aria-pressed={selected}
      className={isDying ? "piece-dying" : ""}
      style={{
        position:     "relative",
        width:        "var(--unit-size)",
        height:       "var(--unit-size)",
        padding:      0,
        border:       "none",
        background:   "transparent",
        cursor:       isValidTarget ? "crosshair" : "pointer",
        outline,
        borderRadius: "var(--radius-sm)",
        transform:    selected ? "scale(1.12)" : isValidTarget ? "scale(1.06)" : "scale(1)",
        transition:   "transform var(--motion-fast), filter var(--motion-fast)",
        filter:       isValidTarget && !selected
          ? "drop-shadow(0 0 8px var(--color-valid-target))"
          : selected
          ? "drop-shadow(0 0 10px white)"
          : isMoving
          ? "drop-shadow(0 4px 10px rgba(0,0,0,0.8)) brightness(1.2)"
          : "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
        animation:    isDying ? "unitDie 0.5s ease forwards" : undefined,
      }}
    >
      {/* Jump spritesheet — shown instead of static image while moving */}
      {isMoving ? (
        <div
          className="hero-jump-sprite"
          style={{
            width:           "100%",
            height:          "100%",
            backgroundImage: `url('${JUMP_SHEET[piece.owner]}')`,
          }}
        />
      ) : (
        <img
          src={getSrc(piece)}
          alt=""
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
        />
      )}

      {/* Weapon icon — player pieces always, CPU only when revealed */}
      {showWeapon && piece.weapon && WEAPON_ICON[piece.weapon] && (
        <img
          src={WEAPON_ICON[piece.weapon]}
          alt={piece.weapon}
          draggable={false}
          style={{
            position:  "absolute",
            bottom:    "1px",
            right:     "1px",
            width:     "20px",
            height:    "20px",
            objectFit: "contain",
            filter:    "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}

      {/* Flag badge */}
      {roleFlag && (
        <img
          src={roleFlag}
          alt="flag"
          draggable={false}
          style={{
            position:  "absolute",
            top:       "-5px",
            left:      "50%",
            transform: "translateX(-50%)",
            width:     "16px",
            height:    "16px",
            objectFit: "contain",
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}

      {/* Decoy diamond badge — only visible to owner or at match end */}
      {((isPlayer && piece.role === "decoy") || (!piece.silhouette && piece.role === "decoy")) && (
        <div
          title="Decoy"
          style={{
            position:     "absolute",
            top:          "-4px",
            right:        "-4px",
            width:        "13px",
            height:       "13px",
            background:   "var(--color-decoy)",
            borderRadius: "2px",
            transform:    "rotate(45deg)",
            border:       "1.5px solid white",
            boxShadow:    "0 1px 3px rgba(0,0,0,0.5)",
          }}
        />
      )}

      {/* Valid target pulse ring */}
      {isValidTarget && !selected && (
        <div
          style={{
            position:     "absolute",
            inset:        "-4px",
            borderRadius: "var(--radius-sm)",
            border:       "2px solid var(--color-valid-target)",
            animation:    "targetPulse 0.8s ease infinite",
            pointerEvents: "none",
          }}
        />
      )}
    </button>
  );
}
