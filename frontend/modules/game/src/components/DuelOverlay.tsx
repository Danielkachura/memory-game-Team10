import { useEffect, useState } from "react";
import type { Weapon } from "../hooks/useGame";

interface DuelSummary {
  attackerId: string;
  attackerName: string;
  attackerWeapon: Weapon;
  defenderId: string;
  defenderName: string;
  defenderWeapon: Weapon;
  winner: "attacker" | "defender" | "tie";
  tie?: boolean;
  revealedRole?: "soldier" | "flag" | "decoy";
  decoyAbsorbed?: boolean;
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
  scissors: "/logo_rps_online_nobg.png",
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

type DuelPhase = "windup" | "throw" | "resolved";

export function DuelOverlay({ duel, visible, repick, onRepick }: DuelOverlayProps) {
  const [duelPhase, setDuelPhase] = useState<DuelPhase>("windup");

  useEffect(() => {
    if (!visible) {
      setDuelPhase("windup");
      return;
    }
    setDuelPhase("windup");
    const t1 = window.setTimeout(() => setDuelPhase("throw"), 300);
    const t2 = window.setTimeout(() => setDuelPhase("resolved"), 450);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [visible, duel.attackerId, duel.defenderId, duel.attackerWeapon, duel.defenderWeapon, duel.winner]);

  if (!visible) return null;
  const attackerIsPlayer = duel.attackerId.startsWith("player");
  const defenderIsPlayer = duel.defenderId.startsWith("player");
  const attackerWon = duel.winner === "attacker";
  const defenderWon = duel.winner === "defender";

  return (
    <div
      data-testid="duel-overlay"
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
      {duelPhase === "windup" ? (
        <div className="duel-windup" data-testid="duel-windup">
          <img src={attackerIsPlayer ? "/character_red_kick_nobg.png" : "/character_blue_kick_nobg.png"} alt="" />
          <div className="duel-vs-text">VS</div>
          <img src={defenderIsPlayer ? "/character_red_kick_nobg.png" : "/character_blue_kick_nobg.png"} alt="" />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <WeaponCard
            weapon={duel.attackerWeapon}
            unitId={duel.attackerId}
            label={duel.attackerName}
            className={duelPhase === "throw" ? "weapon-reveal" : duelPhase === "resolved" && duel.winner !== "tie" ? (attackerWon ? "weapon-winner" : "weapon-loser") : ""}
            testId="attacker-weapon-card"
          />
          <div
            className={duel.winner === "tie" && duelPhase === "resolved" ? "tie-divider--shake" : ""}
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-warning)", fontSize: "2rem" }}
          >
            {duel.winner === "tie" ? "=" : "VS"}
          </div>
          <div
            data-testid="defender-weapon-shell"
            className={duel.decoyAbsorbed && duelPhase === "resolved" ? "decoy-shield-pulse" : ""}
          >
            <WeaponCard
              weapon={duel.defenderWeapon}
              unitId={duel.defenderId}
              label={duel.defenderName}
              className={duelPhase === "throw" ? "weapon-reveal" : duelPhase === "resolved" && duel.winner !== "tie" ? (defenderWon ? "weapon-winner" : "weapon-loser") : ""}
              testId="defender-weapon-card"
            />
          </div>
        </div>
      )}
      {duelPhase === "resolved" && !repick ? (
        <div className="duel-reactions" data-testid="duel-reactions">
          {duel.winner === "tie" ? (
            <>
              <img src="/character_red_idle_nobg.png" alt="" className="char-reaction--tie" style={{ width: 56, height: 56, objectFit: "contain" }} />
              <img src="/character_blue_idle_nobg.png" alt="" className="char-reaction--tie" style={{ width: 56, height: 56, objectFit: "contain" }} />
            </>
          ) : (
            <>
              <img
                src={attackerIsPlayer ? "/hero_red_jump_sprites.png" : "/character_blue_idle_nobg.png"}
                alt=""
                className={attackerWon ? "char-reaction--win" : "char-reaction--lose"}
                style={{ width: 56, height: 56, objectFit: "contain" }}
              />
              <img
                src={defenderIsPlayer ? "/hero_red_jump_sprites.png" : "/character_blue_idle_nobg.png"}
                alt=""
                className={defenderWon ? "char-reaction--win" : "char-reaction--lose"}
                style={{ width: 56, height: 56, objectFit: "contain" }}
              />
            </>
          )}
        </div>
      ) : null}
      {duel.revealedRole === "flag" ? (
        <div style={{ color: "var(--color-warning)", fontFamily: "var(--font-heading)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>
          FLAG CAPTURED - MATCH OVER
        </div>
      ) : null}
      {duel.revealedRole === "decoy" ? (
        <div style={{ color: "var(--color-secondary)", fontFamily: "var(--font-heading)", fontSize: "1.25rem", letterSpacing: "0.04em" }}>
          DECOY - INVULNERABLE
        </div>
      ) : null}
      {repick && onRepick ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div style={{ color: "var(--color-warning)", fontFamily: "var(--font-heading)" }}>SELECT NEW WEAPON</div>
          <div style={{ display: "flex", gap: "12px" }}>
            {(["rock", "paper", "scissors"] as Weapon[]).map((weapon) => (
              <button
                key={weapon}
                type="button"
                aria-label={`Choose ${weapon[0].toUpperCase()}${weapon.slice(1)}`}
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

function WeaponCard({ weapon, unitId, label, className = "", testId }: { weapon: Weapon; unitId: string; label: string; className?: string; testId?: string }) {
  return (
    <div data-testid={testId} className={className} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", minWidth: "110px" }}>
      <img src={getWeaponImg(weapon, unitId)} alt={weapon} style={{ width: "72px", height: "72px", objectFit: "contain" }} />
      {label ? <div style={{ fontSize: "0.8rem" }}>{label}</div> : null}
    </div>
  );
}
