import { Difficulty } from "@shared/types";

interface StartScreenProps {
  difficulties: { id: Difficulty; label: string; detail: string }[];
  selected:      Difficulty;
  onSelect:      (d: Difficulty) => void;
  onStart:       () => void;
  loading:       boolean;
}

const DIFF_INFO: Record<Difficulty, { label: string; desc: string; color: string }> = {
  easy: {
    label: "EASY",
    desc:  "AI makes mostly random moves. Good for learning the game.",
    color: "var(--color-success)",
  },
  medium: {
    label: "MEDIUM",
    desc:  "AI remembers revealed weapons and picks winning matchups.",
    color: "var(--color-warning)",
  },
  hard: {
    label: "HARD",
    desc:  "AI pressures known favorable matchups and hunts your flag.",
    color: "var(--color-danger)",
  },
};

export function StartScreen({ difficulties, selected, onSelect, onStart, loading }: StartScreenProps) {
  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     "var(--color-board-bg)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "24px",
      }}
    >
      <div
        style={{
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          gap:           "28px",
          maxWidth:      "520px",
          width:         "100%",
        }}
      >
        {/* Logo */}
        <img
          src="/logo_rps_online_nobg.png"
          alt="RPS Online"
          style={{ width: "220px", objectFit: "contain" }}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            const d = document.createElement("div");
            d.innerHTML = `<span style="font-family:var(--font-heading);font-size:3.5rem;font-style:italic;color:var(--color-logo-text);text-shadow:3px 3px 0 rgba(0,0,0,0.6)">RPS Online</span>`;
            el.parentElement!.appendChild(d);
          }}
        />

        {/* Characters row */}
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <img src="/character_red_idle_nobg.png"   alt="red"    style={{ width: "80px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
          <img src="/character_yellow_idle_nobg.png" alt="ref"    style={{ width: "70px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
          <img src="/character_blue_idle_nobg.png"  alt="blue"   style={{ width: "80px", objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
        </div>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-heading)",
            fontSize:   "1.8rem",
            color:      "var(--color-text)",
            textShadow: "2px 2px 0 rgba(0,0,0,0.6)",
            letterSpacing: "2px",
          }}>
            SQUAD RPS
          </div>
          <div style={{
            fontFamily: "var(--font-ui)",
            fontSize:   "0.85rem",
            color:      "var(--color-text-muted)",
            marginTop:  "4px",
          }}>
            Rock · Paper · Scissors · Flag · Decoy
          </div>
        </div>

        {/* Quick rules */}
        <div style={{
          background:    "rgba(0,0,0,0.35)",
          borderRadius:  "var(--radius-md)",
          padding:       "14px 20px",
          width:         "100%",
          display:       "flex",
          flexDirection: "column",
          gap:           "6px",
        }}>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-logo-text)", fontWeight: "bold", marginBottom: "4px" }}>HOW TO PLAY</div>
          {[
            "🪨 Rock beats ✂️ Scissors  •  📄 Paper beats 🪨 Rock  •  ✂️ Scissors beats 📄 Paper",
            "🚩 Find & defeat the enemy Flag-bearer to WIN",
            "🎭 Decoy absorbs every attack — attacker can still lose",
            "👁 Memorize weapons during the 10-second REVEAL phase",
          ].map((rule, i) => (
            <div key={i} style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              {rule}
            </div>
          ))}
        </div>

        {/* Difficulty selection */}
        <div style={{ width: "100%" }}>
          <div style={{
            fontFamily:   "var(--font-body)",
            fontSize:     "0.9rem",
            color:        "var(--color-text-muted)",
            marginBottom: "10px",
            textAlign:    "center",
            letterSpacing: "1px",
          }}>
            CHOOSE DIFFICULTY
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            {difficulties.map((d) => {
              const info = DIFF_INFO[d.id];
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelect(d.id)}
                  style={{
                    flex:          1,
                    padding:       "12px 8px",
                    borderRadius:  "var(--radius-md)",
                    border:        selected === d.id ? `3px solid ${info.color}` : "3px solid rgba(255,255,255,0.15)",
                    background:    selected === d.id ? `rgba(0,0,0,0.5)` : "rgba(0,0,0,0.25)",
                    cursor:        "pointer",
                    display:       "flex",
                    flexDirection: "column",
                    alignItems:    "center",
                    gap:           "6px",
                    transform:     selected === d.id ? "scale(1.05)" : "scale(1)",
                    transition:    "all 0.15s ease",
                    boxShadow:     selected === d.id ? `0 0 12px ${info.color}55` : "none",
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-heading)",
                    fontSize:   "1.1rem",
                    color:      info.color,
                    textShadow: "1px 1px 0 rgba(0,0,0,0.6)",
                  }}>
                    {info.label}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-ui)",
                    fontSize:   "0.68rem",
                    color:      "var(--color-text-muted)",
                    textAlign:  "center",
                    lineHeight: "1.3",
                  }}>
                    {info.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          style={{
            fontFamily:   "var(--font-heading)",
            fontSize:     "1.6rem",
            letterSpacing: "3px",
            padding:       "16px 60px",
            background:    "var(--color-logo-text)",
            color:         "#1a3a00",
            border:        "3px solid #8aaa00",
            borderRadius:  "var(--radius-md)",
            cursor:        loading ? "wait" : "pointer",
            boxShadow:     "0 6px 20px rgba(0,0,0,0.5)",
            transition:    "transform 0.1s, box-shadow 0.1s",
            opacity:       loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            (e.target as HTMLButtonElement).style.transform  = "scale(1.06)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.6)";
          }}
          onMouseLeave={(e) => {
            if (loading) return;
            (e.target as HTMLButtonElement).style.transform  = "scale(1)";
            (e.target as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.5)";
          }}
        >
          {loading ? "PREPARING..." : "▶ START"}
        </button>
      </div>
    </div>
  );
}
