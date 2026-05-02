import { Phase, DuelSummary, MatchStats, Difficulty, MatchView, Weapon } from "@shared/types";
import { REVEAL_DURATION_SECONDS } from "@shared/constants";

interface SidebarProps {
  phase:        Phase;
  revealTimer:  number;
  stats:        MatchStats;
  match:        MatchView;
  difficulty:   Difficulty;
}

const PHASE_INFO: Record<string, { text: string; color: string }> = {
  reveal:      { text: "MEMORIZE!",       color: "var(--color-warning)" },
  player_turn: { text: "YOUR TURN",       color: "var(--color-success)" },
  ai_turn:     { text: "AI...",           color: "var(--color-label-cpu)" },
  repick:      { text: "TIE! RE-PICK",    color: "var(--color-warning)" },
  finished:    { text: "GAME OVER",       color: "var(--color-text-muted)" },
};

const DIFF_COLOR: Record<Difficulty, string> = {
  easy:   "var(--color-success)",
  medium: "var(--color-warning)",
  hard:   "var(--color-danger)",
};

const WEAPON_EMOJI: Record<Weapon, string> = {
  rock: "🪨", paper: "📄", scissors: "✂️",
};

export function Sidebar({
  phase, revealTimer, stats, match, difficulty,
}: SidebarProps) {
  const info = PHASE_INFO[phase] ?? { text: "...", color: "var(--color-text-muted)" };

  const aliveAi     = match.board.filter(p => p.owner === "ai" && p.alive).length;
  const alivePlayer = match.board.filter(p => p.owner === "player" && p.alive).length;

  return (
    <div
      data-testid="sidebar"
      style={{
        width:         "var(--sidebar-width)",
        background:    "var(--color-sidebar-bg)",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           "14px",
        padding:       "14px 10px",
        borderLeft:    "3px solid var(--color-board-border)",
        overflowY:     "auto",
      }}
    >
      {/* Logo */}
      <img
        src="/logo_rps_online_nobg.png"
        alt="RPS Online"
        style={{ width: "130px", objectFit: "contain" }}
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          el.style.display = "none";
          el.insertAdjacentHTML("afterend", `
            <div style="font-family:var(--font-heading);font-size:2rem;font-style:italic;color:var(--color-logo-text);text-shadow:2px 2px 0 rgba(0,0,0,0.5);line-height:1;text-align:center">RPS<br><span style="font-size:0.8rem;color:var(--color-text);letter-spacing:0.1em">Online</span></div>
          `);
        }}
      />

      {/* Difficulty badge */}
      <div style={{
        fontFamily:   "var(--font-body)",
        fontSize:     "0.75rem",
        fontWeight:   "bold",
        color:        DIFF_COLOR[difficulty],
        border:       `1.5px solid ${DIFF_COLOR[difficulty]}`,
        borderRadius: "var(--radius-sm)",
        padding:      "2px 10px",
        textTransform: "uppercase",
        letterSpacing: "1px",
      }}>
        {difficulty}
      </div>

      {/* Timer or yin-yang */}
      {phase === "reveal" ? (
        <RevealTimer seconds={revealTimer} />
      ) : (
        <YinYangCircle />
      )}

      {/* Phase indicator */}
      <div style={{
        fontFamily:  "var(--font-body)",
        fontSize:    "0.9rem",
        fontWeight:  "bold",
        color:       info.color,
        textAlign:   "center",
        padding:     "5px 10px",
        background:  "rgba(0,0,0,0.3)",
        borderRadius: "var(--radius-sm)",
        minWidth:    "110px",
        letterSpacing: "0.5px",
      }}>
        {info.text}
      </div>

      {/* Alive counters */}
      <div style={{ width: "100%", display: "flex", gap: "6px" }}>
        <TeamCount label="AI"  alive={aliveAi}     total={10} color="var(--color-label-cpu)" />
        <TeamCount label="YOU" alive={alivePlayer} total={10} color="var(--color-label-player)" />
      </div>

      {/* Stats */}
      <div style={{
        width:         "100%",
        background:    "rgba(0,0,0,0.25)",
        borderRadius:  "var(--radius-sm)",
        padding:       "8px 10px",
        display:       "flex",
        flexDirection: "column",
        gap:           "4px",
      }}>
        <StatRow label="Duels Won"  value={stats.playerDuelsWon} color="var(--color-success)" />
        <StatRow label="Duels Lost" value={stats.playerDuelsLost} color="var(--color-danger)" />
        <StatRow label="Decoy Blocks" value={stats.decoyAbsorbed} color="var(--color-decoy)" />
        <StatRow label="Tie Rounds"   value={stats.tieSequences} color="var(--color-warning)" />
      </div>

      {/* Current Duel Info */}
      {match.duel && (
        <div style={{ width: "100%" }}>
          <div style={{
            fontFamily:   "var(--font-ui)",
            fontSize:     "0.68rem",
            color:        "var(--color-text-muted)",
            marginBottom: "4px",
            letterSpacing: "0.5px",
          }}>
            CURRENT DUEL
          </div>
          <DuelLogEntry duel={match.duel} />
        </div>
      )}

      {/* Referee + help */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <img
          src="/character_yellow_idle_nobg.png"
          alt="referee"
          style={{ width: "60px", height: "60px", objectFit: "contain", opacity: 0.8 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div style={{
          fontFamily: "var(--font-ui)",
          fontSize:   "0.62rem",
          color:      "var(--color-text-muted)",
          textAlign:  "center",
          lineHeight: "1.4",
        }}>
          🪨 &gt; ✂️ &gt; 📄 &gt; 🪨
        </div>
      </div>
    </div>
  );
}

function TeamCount({ label, alive, total, color }: {
  label: string; alive: number; total: number; color: string;
}) {
  const pct = (alive / total) * 100;
  return (
    <div style={{
      flex:          1,
      background:    "rgba(0,0,0,0.3)",
      borderRadius:  "var(--radius-sm)",
      padding:       "6px 8px",
      textAlign:     "center",
    }}>
      <div style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color, fontWeight: "bold" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", color, marginBottom: "4px" }}>
        {alive}
      </div>
      {/* Health bar */}
      <div style={{ height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{
          height:     "100%",
          width:      `${pct}%`,
          background: color,
          borderRadius: "2px",
          transition:  "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color, fontWeight: "bold" }}>{value}</span>
    </div>
  );
}

function DuelLogEntry({ duel }: { duel: DuelSummary }) {
  const attackerWeapon = duel.attackerWeapon;
  const defenderWeapon = duel.defenderWeapon;

  let result = "⚔️";
  if (duel.tie) result = "⚖️";
  else if (duel.decoyAbsorbed) result = "🎭";
  else if (duel.winner === "attacker") result = "🏆";
  else result = "🛡️";

  return (
    <div style={{
      display:       "flex",
      alignItems:    "center",
      gap:           "4px",
      padding:       "3px 6px",
      background:    "rgba(0,0,0,0.2)",
      borderRadius:  "3px",
      fontSize:      "0.68rem",
      fontFamily:    "var(--font-ui)",
      color:         "var(--color-text-muted)",
    }}>
      <span style={{ fontSize: "0.9rem" }}>{result}</span>
      <span style={{ color: "var(--color-label-player)" }}>
        {WEAPON_EMOJI[attackerWeapon] ?? "?"}
      </span>
      <span>vs</span>
      <span style={{ color: "var(--color-label-cpu)" }}>
        {WEAPON_EMOJI[defenderWeapon] ?? "?"}
      </span>
    </div>
  );
}

function RevealTimer({ seconds }: { seconds: number }) {
  const pct  = (seconds / REVEAL_DURATION_SECONDS) * 100;
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div data-testid="reveal-timer" style={{ position: "relative", width: "110px", height: "110px" }}>
      <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="55" cy="55" r={r} fill="var(--color-timer-bg)" stroke="var(--color-board-border)" strokeWidth="5" />
        <circle
          cx="55" cy="55" r={r}
          fill="none"
          stroke={seconds <= 3 ? "var(--color-danger)" : "var(--color-timer-fill)"}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.9s linear" }}
        />
      </svg>
      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
      }}>
        <span style={{
          fontFamily:  "var(--font-mono)",
          fontSize:    "2rem",
          fontWeight:  "bold",
          color:       seconds <= 3 ? "var(--color-danger)" : "var(--color-timer-fill)",
          textShadow:  "0 0 8px rgba(0,0,0,0.8)",
          animation:   seconds <= 3 ? "pulse 0.5s ease infinite" : undefined,
        }}>
          {seconds}
        </span>
        <span style={{ fontSize: "0.55rem", color: "var(--color-text-muted)" }}>SEC</span>
      </div>
    </div>
  );
}

function YinYangCircle() {
  return (
    <div data-testid="yin-yang" style={{
      width:          "110px",
      height:         "110px",
      borderRadius:   "50%",
      background:     "var(--color-timer-bg)",
      border:         "3px solid var(--color-board-border)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      boxShadow:      "0 4px 12px rgba(0,0,0,0.4)",
    }}>
      <img
        src="/yin_yang_labeled_nobg.png"
        alt="yin yang"
        style={{ width: "90px", height: "90px", objectFit: "contain" }}
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          img.style.display = "none";
          img.parentElement!.textContent = "☯️";
          (img.parentElement as HTMLElement).style.fontSize = "3.5rem";
        }}
      />
    </div>
  );
}
