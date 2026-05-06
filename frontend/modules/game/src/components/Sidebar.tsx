import type { CSSProperties } from "react";
import { Phase, DuelSummary, MatchStats, Difficulty, MatchView, Weapon } from "@shared/types";
import { REVEAL_DURATION_SECONDS, TURN_DURATION_SECONDS, UNITS_PER_SQUAD } from "@shared/constants";

interface SidebarProps {
  phase:        Phase;
  revealTimer:  number;
  turnTimer:    number;
  stats:        MatchStats;
  match:        MatchView;
  difficulty:   Difficulty;
  loading:      boolean;
  onShufflePositions: () => Promise<void>;
  onResetGame:  () => Promise<void>;
  onBackToMenu: () => void;
}

const DIFF_COLOR: Record<Difficulty, string> = {
  easy:   "#44DD66",
  medium: "#FFAA22",
  hard:   "#FF4444",
};

const WEAPON_EMOJI: Record<Weapon, string> = {
  rock: "🪨", paper: "📄", scissors: "✂️",
};

const PHASE_LABEL: Record<string, { text: string; color: string }> = {
  reveal:      { text: "MEMORIZE",    color: "#FFAA22" },
  player_turn: { text: "YOUR TURN",  color: "#44DD66" },
  ai_turn:     { text: "AI MOVING",  color: "#00A3FF" },
  repick:      { text: "TIE — REPICK", color: "#FFAA22" },
  finished:    { text: "GAME OVER",  color: "#A0A0A0" },
};

const GLASS: CSSProperties = {
  background:   "#1F231B",
  border:       "1px solid rgba(255, 255, 255, 0.06)",
  borderRadius: "10px",
};

export function Sidebar({
  phase, revealTimer, turnTimer, stats, match, difficulty, loading, onShufflePositions, onResetGame, onBackToMenu,
}: SidebarProps) {
  const aliveAi     = match.board.filter(p => p.owner === "ai"     && p.alive).length;
  const alivePlayer = match.board.filter(p => p.owner === "player" && p.alive).length;
  const hasPlayerFlag = match.board.some(
    (piece) => piece.owner === "player" && piece.alive && piece.role === "flag",
  );
  const totalAlive  = aliveAi + alivePlayer;
  // Fraction of total alive that belongs to the player (0–1), clamped to [0.05, 0.95]
  const playerFrac  = totalAlive > 0
    ? Math.min(0.95, Math.max(0.05, alivePlayer / totalAlive))
    : 0.5;

  const phaseInfo = PHASE_LABEL[phase] ?? { text: "...", color: "#A0A0A0" };
  const showTurnTimer = phase === "player_turn" || phase === "ai_turn" || phase === "repick";
  const displayTurnTimer = Math.min(turnTimer, TURN_DURATION_SECONDS);

  return (
    <div
      data-testid="sidebar"
      style={{
        width:         "var(--sidebar-width)",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           "10px",
        padding:       "14px 10px",
        overflowY:     "auto",
      }}
    >
      {/* Logo */}
      <img
        src="/game_logo_squad_rps.png"
        alt="Squad RPS"
        style={{ width: "120px", objectFit: "contain" }}
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          el.style.display = "none";
          el.insertAdjacentHTML("afterend", `<div style="font-family:var(--font-heading);font-size:1.8rem;font-style:italic;color:var(--color-logo-text);line-height:1;text-align:center">SQUAD<br><span style="font-size:0.7rem;color:var(--color-text);letter-spacing:0.1em">RPS</span></div>`);
        }}
      />

      {/* Opponent profile card */}
      <div style={{ ...GLASS, width: "100%", padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/character_blue_idle_nobg.png"
            alt="AI"
            style={{ width: "44px", height: "44px", objectFit: "contain" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily:    "var(--font-body)",
              fontSize:      "0.78rem",
              fontWeight:    700,
              color:         "var(--color-label-cpu)",
              letterSpacing: "0.5px",
            }}>
              AI SQUAD
            </div>
            {/* Difficulty badge */}
            <span style={{
              fontFamily:    "var(--font-body)",
              fontSize:      "0.6rem",
              fontWeight:    700,
              color:         DIFF_COLOR[difficulty],
              border:        `1px solid ${DIFF_COLOR[difficulty]}`,
              borderRadius:  "3px",
              padding:       "1px 6px",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}>
              {difficulty}
            </span>
          </div>
          {/* Settings / pause icon */}
          <button
            type="button"
            title="Settings"
            style={{
              background: "transparent",
              border:     "none",
              cursor:     "pointer",
              color:      "var(--color-text-muted)",
              fontSize:   "1rem",
              padding:    "2px",
              lineHeight: 1,
            }}
          >
            ⚙️
          </button>
        </div>

        {/* AI health bar */}
        <div style={{ marginTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.6rem", color: "var(--color-text-muted)" }}>UNITS</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--color-label-cpu)" }}>
              {aliveAi}/{UNITS_PER_SQUAD}
            </span>
          </div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{
              height:       "100%",
              width:        `${(aliveAi / UNITS_PER_SQUAD) * 100}%`,
              background:   "var(--color-label-cpu)",
              borderRadius: "2px",
              transition:   "width 0.4s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{
        fontFamily:    "var(--font-body)",
        fontSize:      "0.75rem",
        fontWeight:    700,
        color:         phaseInfo.color,
        letterSpacing: "1.5px",
        padding:       "5px 14px",
        background:    "rgba(0,0,0,0.4)",
        borderRadius:  "20px",
        border:        `1px solid ${phaseInfo.color}33`,
      }}>
        {phase === "reveal"
          ? `👁 ${revealTimer}s`
          : showTurnTimer
          ? `${phaseInfo.text} ${displayTurnTimer}s`
          : phaseInfo.text}
      </div>

      {/* Scoreboard */}
      <div style={{ ...GLASS, width: "100%", padding: "10px 12px" }}>
        <div style={{
          fontFamily:    "var(--font-body)",
          fontSize:      "0.6rem",
          color:         "var(--color-text-muted)",
          letterSpacing: "1.5px",
          textAlign:     "center",
          marginBottom:  "8px",
        }}>
          UNITS REMAINING
        </div>

        {/* AI vs YOU counters */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 700, color: "var(--color-label-cpu)", lineHeight: 1 }}>
              {aliveAi}
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.55rem", color: "var(--color-text-muted)", marginTop: "2px" }}>AI</div>
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "0.85rem", color: "rgba(255,255,255,0.2)" }}>vs</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 700, color: "var(--color-label-player)", lineHeight: 1 }}>
              {alivePlayer}
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.55rem", color: "var(--color-text-muted)", marginTop: "2px" }}>YOU</div>
          </div>
        </div>

        {/* Horizontal versus bar */}
        <div
          title={`AI ${aliveAi} — Player ${alivePlayer}`}
          style={{
            display:      "flex",
            height:       "6px",
            borderRadius: "3px",
            overflow:     "hidden",
            background:   "rgba(255,255,255,0.06)",
          }}
        >
          <div style={{
            width:      `${(1 - playerFrac) * 100}%`,
            background: "var(--color-label-cpu)",
            transition: "width 0.5s ease",
          }} />
          <div style={{ width: "2px", background: "rgba(255,255,255,0.15)" }} />
          <div style={{
            flex:       1,
            background: "var(--color-label-player)",
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* Stats table */}
      <div style={{ ...GLASS, width: "100%", padding: "10px 12px" }}>
        <div style={{
          fontFamily:    "var(--font-body)",
          fontSize:      "0.6rem",
          color:         "var(--color-text-muted)",
          letterSpacing: "1.5px",
          marginBottom:  "8px",
        }}>
          STATS
        </div>
        <StatRow icon="⚔️" label="Duels Won"    value={stats.playerDuelsWon}  color="#44DD66" />
        <StatRow icon="🛡️" label="Duels Lost"   value={stats.playerDuelsLost} color="#FF4444" />
        <StatRow icon="🎭" label="Decoy Blocks"  value={stats.decoyAbsorbed}   color="#CF6FFF" />
        <StatRow icon="⚖️" label="Ties"          value={stats.tieSequences}    color="#FFAA22" />
      </div>

      {/* Phase timer ring */}
      {(phase === "reveal" || showTurnTimer) && (
        <CountdownTimer
          seconds={phase === "reveal" ? revealTimer : displayTurnTimer}
          duration={phase === "reveal" ? REVEAL_DURATION_SECONDS : TURN_DURATION_SECONDS}
          testId={phase === "reveal" ? "reveal-timer" : "turn-timer"}
        />
      )}

      {phase === "reveal" && (
        <div style={{ ...GLASS, width: "100%", padding: "8px 12px" }}>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.62rem", color: "var(--color-text-muted)", lineHeight: "1.5" }}>
            {hasPlayerFlag
              ? "הדגל הוצב. אפשר ללחוץ על חייל אחר כדי להעביר אותו לפני תחילת המשחק."
              : "בהתחלה אפשר לערבב את החיילים, ואז ללחוץ על אחד החיילים שלך כדי לקבוע איפה יהיה הדגל."}
          </div>
        </div>
      )}

      {/* Current duel info */}
      {match.duel && (
        <div style={{ ...GLASS, width: "100%", padding: "8px 12px" }}>
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.58rem", color: "var(--color-text-muted)", marginBottom: "4px", letterSpacing: "0.5px" }}>
            LAST DUEL
          </div>
          <DuelLogEntry duel={match.duel} />
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Player health bar */}
      <div style={{ ...GLASS, width: "100%", padding: "8px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-label-player)" }}>YOUR SQUAD</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--color-label-player)" }}>
            {alivePlayer}/{UNITS_PER_SQUAD}
          </span>
        </div>
        <div style={{ height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{
            height:       "100%",
            width:        `${(alivePlayer / UNITS_PER_SQUAD) * 100}%`,
            background:   "var(--color-label-player)",
            borderRadius: "2px",
            transition:   "width 0.4s ease",
          }} />
        </div>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
        {phase === "reveal" && !hasPlayerFlag && (
          <button
            type="button"
            onClick={() => void onShufflePositions()}
            disabled={loading}
            style={{
              width:         "100%",
              fontFamily:    "var(--font-body)",
              fontSize:      "0.78rem",
              fontWeight:    700,
              padding:       "10px 12px",
              background:    loading ? "rgba(255,255,255,0.08)" : "#D48B14",
              color:         "#1F1404",
              border:        "1px solid rgba(255,255,255,0.14)",
              borderRadius:  "10px",
              cursor:        loading ? "wait" : "pointer",
              letterSpacing: "0.4px",
              boxShadow:     loading ? "none" : "0 6px 16px rgba(0,0,0,0.25)",
              opacity:       loading ? 0.75 : 1,
              transition:    "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
            }}
          >
            ערבב חיילים
          </button>
        )}

        <button
          type="button"
          onClick={() => void onResetGame()}
          disabled={loading}
          style={{
            width:         "100%",
            fontFamily:    "var(--font-body)",
            fontSize:      "0.78rem",
            fontWeight:    700,
            padding:       "10px 12px",
            background:    loading ? "rgba(255,255,255,0.08)" : "#AA2E25",
            color:         "#FFF5E8",
            border:        "1px solid rgba(255,255,255,0.14)",
            borderRadius:  "10px",
            cursor:        loading ? "wait" : "pointer",
            letterSpacing: "0.4px",
            boxShadow:     loading ? "none" : "0 6px 16px rgba(0,0,0,0.3)",
            opacity:       loading ? 0.75 : 1,
            transition:    "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
          }}
        >
          איפוס משחק
        </button>

        <button
          type="button"
          onClick={onBackToMenu}
          style={{
            width:         "100%",
            fontFamily:    "var(--font-body)",
            fontSize:      "0.76rem",
            fontWeight:    700,
            padding:       "10px 12px",
            background:    "rgba(255,255,255,0.08)",
            color:         "var(--color-text)",
            border:        "1px solid rgba(255,255,255,0.14)",
            borderRadius:  "10px",
            cursor:        "pointer",
            letterSpacing: "0.4px",
            boxShadow:     "0 4px 12px rgba(0,0,0,0.2)",
            transition:    "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
          }}
        >
          חזרה לתפריט הראשי
        </button>
      </div>

      {/* RPS cheat sheet */}
      <div style={{
        fontFamily: "var(--font-ui)",
        fontSize:   "0.62rem",
        color:      "var(--color-text-muted)",
        textAlign:  "center",
        lineHeight: "1.6",
        padding:    "6px 8px",
        background: "rgba(0,0,0,0.25)",
        borderRadius: "6px",
        width:      "100%",
      }}>
        🪨 beats ✂️ &nbsp;·&nbsp; 📄 beats 🪨 &nbsp;·&nbsp; ✂️ beats 📄
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span style={{ fontSize: "0.7rem" }}>{icon}</span>
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem", color: "var(--color-text-muted)" }}>{label}</span>
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function DuelLogEntry({ duel }: { duel: DuelSummary }) {
  let result = "⚔️";
  if (duel.tie) result = "⚖️";
  else if (duel.decoyAbsorbed) result = "🎭";
  else if (duel.winner === "attacker") result = "🏆";
  else result = "🛡️";

  return (
    <div style={{
      display:    "flex",
      alignItems: "center",
      gap:        "6px",
      fontSize:   "0.68rem",
      fontFamily: "var(--font-ui)",
      color:      "var(--color-text-muted)",
    }}>
      <span style={{ fontSize: "0.9rem" }}>{result}</span>
      <span style={{ color: "var(--color-label-player)" }}>{WEAPON_EMOJI[duel.attackerWeapon] ?? "?"}</span>
      <span>vs</span>
      <span style={{ color: "var(--color-label-cpu)" }}>{WEAPON_EMOJI[duel.defenderWeapon] ?? "?"}</span>
    </div>
  );
}

function CountdownTimer({ seconds, duration, testId }: { seconds: number; duration: number; testId: string }) {
  const pct  = duration > 0 ? Math.min(100, (seconds / duration) * 100) : 0;
  const r    = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div data-testid={testId} style={{ position: "relative", width: "90px", height: "90px" }}>
      <svg width="90" height="90" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="45" cy="45" r={r} fill="var(--color-timer-bg)" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="45" cy="45" r={r}
          fill="none"
          stroke={seconds <= 3 ? "#FF4444" : "var(--color-timer-fill)"}
          strokeWidth="5"
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
          fontFamily: "var(--font-mono)",
          fontSize:   "1.6rem",
          fontWeight: "bold",
          color:      seconds <= 3 ? "#FF4444" : "var(--color-timer-fill)",
        }}>
          {seconds}
        </span>
        <span style={{ fontSize: "0.5rem", color: "var(--color-text-muted)" }}>SEC</span>
      </div>
    </div>
  );
}
