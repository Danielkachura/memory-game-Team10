import type { Difficulty } from "../hooks/useGame";
import { SettingsPanel } from "./SettingsPanel";

interface StartScreenProps {
  difficulties: { id: Difficulty; label: string; detail: string }[];
  selected: Difficulty;
  onSelect: (d: Difficulty) => void;
  onStart: () => void;
  loading: boolean;
  onBack?: () => void;
}

const DIFF_INFO: Record<Difficulty, { label: string; desc: string; color: string }> = {
  easy: {
    label: "EASY",
    desc: "AI makes mostly random moves. Good for learning the game.",
    color: "var(--color-success)",
  },
  medium: {
    label: "MEDIUM",
    desc: "AI remembers revealed weapons and picks winning matchups.",
    color: "var(--color-warning)",
  },
  hard: {
    label: "HARD",
    desc: "AI pressures known favorable matchups and hunts your flag.",
    color: "var(--color-danger)",
  },
};

export function StartScreen({ difficulties, selected, onSelect, onStart, loading, onBack }: StartScreenProps) {
  return (
    <div className="start-screen">
      <div className="start-screen__stack">
        <div className="shell-toolbar shell-toolbar--inset">
          <SettingsPanel />
        </div>
        <img
          src="/logo_rps_online_nobg.png"
          alt="RPS Online"
          className="start-screen__logo"
          onError={(event) => {
            const el = event.target as HTMLImageElement;
            el.style.display = "none";
            const fallback = document.createElement("div");
            fallback.innerHTML =
              '<span style="font-family:var(--font-heading);font-size:3.5rem;font-style:italic;color:var(--color-logo-text);text-shadow:3px 3px 0 rgba(0,0,0,0.6)">RPS Online</span>';
            el.parentElement?.appendChild(fallback);
          }}
        />

        <div className="start-screen__mascot-row">
          <img src="/character_red_idle_nobg.png" alt="red" style={{ width: "80px", objectFit: "contain" }} />
          <img src="/character_yellow_idle_nobg.png" alt="referee" style={{ width: "70px", objectFit: "contain" }} />
          <img src="/character_blue_idle_nobg.png" alt="blue" style={{ width: "80px", objectFit: "contain" }} />
        </div>

        <div className="start-screen__hero">
          <div className="start-screen__hero-title">SQUAD RPS</div>
          <div className="start-screen__hero-subtitle">Rock | Paper | Scissors | Flag | Decoy</div>
        </div>

        <div className="start-screen__rules">
          <div className="start-screen__rules-title">HOW TO PLAY</div>
          {[
            "Rock beats Scissors. Paper beats Rock. Scissors beats Paper.",
            "Find and defeat the enemy flag-bearer to win.",
            "Decoy absorbs every attack, so the attacker can still lose.",
            "Memorize weapons during the 10-second reveal phase.",
          ].map((rule) => (
            <div key={rule} className="start-screen__rule">{rule}</div>
          ))}
        </div>

        <div className="start-screen__difficulty">
          <div className="start-screen__difficulty-label">CHOOSE DIFFICULTY</div>
          <div className="start-screen__difficulty-row">
            {difficulties.map((difficulty) => {
              const info = DIFF_INFO[difficulty.id];
              return (
                <button
                  key={difficulty.id}
                  type="button"
                  onClick={() => onSelect(difficulty.id)}
                  className={`start-screen__difficulty-card ${selected === difficulty.id ? "start-screen__difficulty-card--selected" : ""}`}
                  style={{
                    border: selected === difficulty.id ? `3px solid ${info.color}` : "3px solid rgba(255,255,255,0.15)",
                    background: selected === difficulty.id ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.25)",
                    boxShadow: selected === difficulty.id ? `0 0 12px ${info.color}55` : "none",
                  }}
                >
                  <span className="start-screen__difficulty-card-title" style={{ color: info.color }}>{info.label}</span>
                  <span className="start-screen__difficulty-card-copy">{info.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="start-screen__actions">
          <button
            type="button"
            onClick={onStart}
            disabled={loading}
            className="start-screen__cta"
          >
            {loading ? "Preparing Match..." : "Start Match"}
          </button>
          {onBack ? (
            <button type="button" className="secondary-button" onClick={onBack}>
              Back
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
