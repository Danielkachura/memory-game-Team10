import { Piece } from "@shared/types";

interface UnitSpriteProps {
  piece:         Piece;
  selected:      boolean;
  isSelectable:  boolean;
  isValidTarget: boolean;
  isRevealPhase: boolean;
  isDying:       boolean;
  isMoving?:     boolean;
  onClick:       () => void;
}

const PLAYER_IMG: Record<string, string> = {
  rock:     "/character_red_rock_nobg.png",
  paper:    "/character_red_paper_nobg.png",
  scissors: "/logo_rps_online_nobg.png",
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
  if (piece.silhouette) return CPU_IMG.hidden;
  if (piece.role === "flag") return CPU_IMG.flag;
  return (piece.weapon && CPU_IMG[piece.weapon]) ?? CPU_IMG.idle;
}

export function UnitSprite({
  piece, selected, isSelectable, isValidTarget, isRevealPhase, isDying, isMoving = false, onClick,
}: UnitSpriteProps) {
  const isPlayer = piece.owner === "player";
  const showWeapon = !piece.silhouette && piece.weapon;
  const showSelectableHint = isSelectable && !selected && !isValidTarget && !isRevealPhase;
  const isRevealFlagChoice = isRevealPhase && isPlayer;

  // Gold ring when selected, gold pulse when valid target
  let outline = "none";
  if (selected)        outline = "3px solid #FFD700";
  else if (isValidTarget) outline = "3px solid #FFD700";
  else if (showSelectableHint) outline = "2px solid rgba(255, 215, 0, 0.35)";

  const roleFlag = piece.role === "flag"
    ? (isPlayer ? "/flag_red_nobg.png" : "/flag_blue_nobg.png")
    : null;

  // Scale only — no idle animation; brief scale-up when moving for tactile feel
  const scale = selected ? "scale(1.14)"
              : isValidTarget ? "scale(1.07)"
              : isMoving ? "scale(1.18)"
              : "scale(1)";

  const filter = isValidTarget && !selected
    ? "drop-shadow(0 0 8px #FFD700)"
    : selected
    ? "drop-shadow(0 0 12px #FFD700)"
    : isMoving
    ? "drop-shadow(0 4px 10px rgba(0,0,0,0.9)) brightness(1.25)"
    : showSelectableHint
    ? "drop-shadow(0 0 6px rgba(255,215,0,0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
    : "drop-shadow(0 2px 4px rgba(0,0,0,0.6))";

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
        cursor:       isValidTarget ? "crosshair" : isSelectable || isRevealFlagChoice ? "pointer" : "default",
        outline,
        borderRadius: "var(--radius-sm)",
        transform:    scale,
        transition:   "transform 120ms ease, filter 120ms ease",
        filter,
        animation:    isDying ? "unitDie 0.5s ease forwards" : undefined,
      }}
    >
      <img
        src={getSrc(piece)}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
      />

      {/* Weapon icon — player always, CPU only when revealed */}
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
            filter:    "drop-shadow(0 1px 2px rgba(0,0,0,0.9))",
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
            top:       "-6px",
            left:      "50%",
            transform: "translateX(-50%)",
            width:     "18px",
            height:    "18px",
            objectFit: "contain",
            filter:    "drop-shadow(0 0 4px #FFD700)",
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}

      {/* Decoy diamond badge */}
      {((isPlayer && piece.role === "decoy") || (!piece.silhouette && piece.role === "decoy")) && (
        <div
          title="Decoy"
          style={{
            position:     "absolute",
            top:          "-5px",
            right:        "-5px",
            width:        "13px",
            height:       "13px",
            background:   "var(--color-decoy)",
            borderRadius: "2px",
            transform:    "rotate(45deg)",
            border:       "1.5px solid rgba(255,255,255,0.8)",
            boxShadow:    "0 0 6px rgba(207,111,255,0.6)",
          }}
        />
      )}

      {/* Gold pulse ring for valid attack targets */}
      {isValidTarget && !selected && (
        <div
          style={{
            position:     "absolute",
            inset:        "-5px",
            borderRadius: "var(--radius-sm)",
            border:       "2px solid #FFD700",
            animation:    "targetPulse 0.8s ease infinite",
            pointerEvents: "none",
          }}
        />
      )}
    </button>
  );
}
