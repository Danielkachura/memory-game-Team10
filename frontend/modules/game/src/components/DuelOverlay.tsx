import { DuelSummary, Weapon } from "@shared/types";

interface DuelOverlayProps {
  duel:     DuelSummary;
  visible:  boolean;
  repick?:  boolean;
  onRepick?: (weapon: Weapon) => void;
}

const WEAPON_IMG: Record<string, string> = {
  rock:     "/rock_nobg.png",
  paper:    "/paper_flat_nobg.png",
  scissors: "/scissors_nobg.png",
};

const WEAPON_LABEL: Record<string, string> = {
  rock:     "🪨 Rock",
  paper:    "📄 Paper",
  scissors: "✂️ Scissors",
};

// Which weapon beats which, and the flavour text
const BEATS_TEXT: Partial<Record<Weapon, Partial<Record<Weapon, string>>>> = {
  rock:     { scissors: "Rock crushes Scissors" },
  paper:    { rock:     "Paper covers Rock" },
  scissors: { paper:    "Scissors cuts Paper" },
};

function weaponBeatsText(winner: Weapon, loser: Weapon): string {
  return BEATS_TEXT[winner]?.[loser] ?? `${winner} beats ${loser}`;
}

function WeaponCard({ weapon, label, isWinner, isLoser, isSelectable, onClick }: {
  weapon: Weapon; label: string; isWinner: boolean; isLoser: boolean;
  isSelectable?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            "8px",
        padding:        "12px 20px",
        borderRadius:   "var(--radius-md)",
        background:     isWinner ? "rgba(68,187,68,0.3)"
                      : isLoser  ? "rgba(204,0,0,0.3)"
                      : "rgba(0,0,0,0.3)",
        border:         isWinner ? "2px solid var(--color-success)"
                      : isLoser  ? "2px solid var(--color-danger)"
                      : "2px solid rgba(255,255,255,0.2)",
        transform:      isWinner ? "scale(1.1)" : isLoser ? "scale(0.92)" : "scale(1)",
        transition:     "all 0.4s ease",
        minWidth:       "110px",
        cursor:         isSelectable ? "pointer" : "default",
      }}
    >
      <img
        src={WEAPON_IMG[weapon] ?? ""}
        alt={weapon}
        style={{ width: "80px", height: "80px", objectFit: "contain" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      <span style={{
        fontFamily: "var(--font-heading)",
        fontSize:   "1.1rem",
        color:      isWinner ? "var(--color-success)" : isLoser ? "var(--color-danger)" : "var(--color-text)",
        textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
      }}>
        {WEAPON_LABEL[weapon] ?? weapon}
      </span>
    </div>
  );
}

export function DuelOverlay({ duel, visible, repick, onRepick }: DuelOverlayProps) {
  if (!visible) return null;

  const attackerWon    = duel.winner === "attacker";
  const defenderWon    = duel.winner === "defender";
  const isTie          = duel.tie;

  // Derive team from ID prefix so colours reflect the actual players
  const attackerIsPlayer = duel.attackerId.startsWith("player");
  const attackerColor    = attackerIsPlayer ? "var(--color-label-player)" : "var(--color-label-cpu)";
  const defenderColor    = attackerIsPlayer ? "var(--color-label-cpu)"    : "var(--color-label-player)";
  const attackerImg      = attackerIsPlayer ? "/character_red_idle_nobg.png"   : "/character_blue_front_nobg.png";
  const defenderImg      = attackerIsPlayer ? "/character_blue_front_nobg.png" : "/character_red_idle_nobg.png";

  // Human-readable result text
  let resultText = "";
  let beatsLine  = "";
  if (isTie) {
    resultText = "⚖️ TIE! Pick a new weapon!";
  } else if (duel.decoyAbsorbed) {
    resultText = "🎭 DECOY! Attack was absorbed!";
  } else if (attackerWon) {
    resultText = `⚔️ ${duel.attackerName} WINS!`;
    beatsLine  = weaponBeatsText(duel.attackerWeapon, duel.defenderWeapon);
  } else if (defenderWon) {
    resultText = `🛡️ ${duel.defenderName} DEFENDED!`;
    beatsLine  = weaponBeatsText(duel.defenderWeapon, duel.attackerWeapon);
  }

  return (
    <div
      className="duel-overlay"
      style={{
        position:       "absolute",
        inset:          0,
        background:     "rgba(0,0,0,0.85)",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            "20px",
        zIndex:         100,
        borderRadius:   "2px",
        animation:      "fadeIn 0.2s ease",
      }}
    >
      <div style={{
        fontFamily:    "var(--font-heading)",
        fontSize:      "2rem",
        color:         "var(--color-logo-text)",
        textShadow:    "2px 2px 0 rgba(0,0,0,0.8)",
        letterSpacing: "2px",
      }}>
        ⚔️ DUEL!
      </div>

      {/* Attacker vs Defender */}
      <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
        {/* Attacker */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <img
            src={attackerImg}
            alt="attacker"
            style={{ width: "72px", height: "72px", objectFit: "contain" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }}>
            ATTACKER
          </span>
          <span style={{ fontSize: "0.8rem", color: attackerColor, fontFamily: "var(--font-body)", fontWeight: "bold" }}>
            {duel.attackerName}
          </span>
          <WeaponCard
            weapon={duel.attackerWeapon}
            label={WEAPON_LABEL[duel.attackerWeapon]}
            isWinner={attackerWon && !duel.decoyAbsorbed}
            isLoser={defenderWon && !duel.decoyAbsorbed}
          />
        </div>

        <div style={{
          fontFamily: "var(--font-heading)",
          fontSize:   "2.5rem",
          color:      "var(--color-warning)",
          textShadow: "2px 2px 0 rgba(0,0,0,0.8)",
        }}>
          {isTie ? "=" : "VS"}
        </div>

        {/* Defender */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <img
            src={defenderImg}
            alt="defender"
            style={{ width: "72px", height: "72px", objectFit: "contain" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontFamily: "var(--font-ui)" }}>
            DEFENDER
          </span>
          <span style={{ fontSize: "0.8rem", color: defenderColor, fontFamily: "var(--font-body)", fontWeight: "bold" }}>
            {duel.defenderName}
          </span>
          <WeaponCard
            weapon={duel.defenderWeapon}
            label={WEAPON_LABEL[duel.defenderWeapon]}
            isWinner={defenderWon && !duel.decoyAbsorbed}
            isLoser={attackerWon && !duel.decoyAbsorbed}
          />
        </div>
      </div>

      {/* Result block */}
      {resultText && !repick && (
        <div style={{
          display:      "flex",
          flexDirection:"column",
          alignItems:   "center",
          gap:          "6px",
          padding:      "12px 28px",
          background:   "rgba(0,0,0,0.5)",
          borderRadius: "var(--radius-sm)",
          textAlign:    "center",
        }}>
          <span style={{
            fontFamily:    "var(--font-heading)",
            fontSize:      "1.5rem",
            color:         isTie       ? "var(--color-warning)"
                         : attackerWon ? "var(--color-success)"
                         :               "var(--color-danger)",
            textShadow:    "2px 2px 0 rgba(0,0,0,0.8)",
            letterSpacing: "1px",
          }}>
            {resultText}
          </span>
          {beatsLine && (
            <span style={{
              fontFamily: "var(--font-ui)",
              fontSize:   "0.82rem",
              color:      "var(--color-text-muted)",
              letterSpacing: "0.5px",
            }}>
              {beatsLine}
            </span>
          )}
        </div>
      )}

      {/* Re-pick panel */}
      {repick && onRepick && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ fontFamily: "var(--font-heading)", color: "var(--color-warning)", fontSize: "1.2rem" }}>
            SELECT NEW WEAPON:
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            {(["rock", "paper", "scissors"] as Weapon[]).map(w => (
              <WeaponCard
                key={w}
                weapon={w}
                label={WEAPON_LABEL[w]}
                isWinner={false}
                isLoser={false}
                isSelectable={true}
                onClick={() => onRepick(w)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
