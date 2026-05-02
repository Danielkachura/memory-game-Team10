import type { Weapon } from "../hooks/useGame";

interface DuelSummary {
  attackerName: string;
  attackerWeapon: Weapon;
  defenderName: string;
  defenderWeapon: Weapon;
  winner: "attacker" | "defender" | "tie";
}

interface DuelOverlayProps {
  duel: DuelSummary;
  visible: boolean;
  repick?: boolean;
  onRepick?: (weapon: Weapon) => void;
}

const PLAYER_WEAPON_IMG: Record<Weapon, string> = {
  rock: "/character_red_rock_nobg.png",
  paper: "/character_red_paper_nobg.png",
  scissors: "/character_red_scissors_nobg.png",
};

const AI_WEAPON_IMG: Record<Weapon, string> = {
  rock: "/rock_nobg.png",
  paper: "/paper_flat_nobg.png",
  scissors: "/character_blue_scissors_nobg.png",
};

function getWeaponImg(weapon: Weapon, unitId: string): string {
  const owner = unitId.startsWith("player") ? "player" : "ai";
  return owner === "player" ? PLAYER_WEAPON_IMG[weapon] : AI_WEAPON_IMG[weapon];
}

export function DuelOverlay({ duel, visible, repick, onRepick }: DuelOverlayProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        borderRadius: "8px",
      }}
    >
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", color: "var(--color-secondary)" }}>DUEL</div>
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <WeaponCard weapon={duel.attackerWeapon} unitId={duel.attackerId} label={duel.attackerName} />
        <div style={{ fontFamily: "var(--font-heading)", color: "var(--color-warning)", fontSize: "2rem" }}>{duel.winner === "tie" ? "=" : "VS"}</div>
        <WeaponCard weapon={duel.defenderWeapon} unitId={duel.defenderId} label={duel.defenderName} />
      </div>
      {repick && onRepick ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div style={{ color: "var(--color-warning)", fontFamily: "var(--font-heading)" }}>SELECT NEW WEAPON</div>
          <div style={{ display: "flex", gap: "12px" }}>
            {(["rock", "paper", "scissors"] as Weapon[]).map((weapon) => (
              <button
                key={weapon}
                type="button"
                onClick={() => onRepick(weapon)}
                style={{ border: "none", background: "transparent", cursor: "pointer" }}
              >
                <WeaponCard weapon={weapon} unitId={duel.attackerId} label="" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WeaponCard({ weapon, unitId, label }: { weapon: Weapon; unitId: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", minWidth: "110px" }}>
      <img src={getWeaponImg(weapon, unitId)} alt={weapon} style={{ width: "72px", height: "72px", objectFit: "contain" }} />
      {label ? <div style={{ fontSize: "0.8rem" }}>{label}</div> : null}
    </div>
  );
}
