import { SettingsPanel } from "./SettingsPanel";

interface HomeScreenProps {
  onChooseAi: () => void;
  onChooseOnline: () => void;
}

export function HomeScreen({ onChooseAi, onChooseOnline }: HomeScreenProps) {
  return (
    <main className="squad-shell">
      <div className="squad-backdrop" />
      <div className="squad-layout">
        <div className="shell-toolbar">
          <SettingsPanel />
        </div>
        <section className="panel setup-panel">
          <p className="eyebrow">Squad RPS - Team 10</p>
          <h1 className="hero-title">Flag hunts, decoys, and hidden weapons.</h1>
          <p className="hero-copy">
            Memorize the enemy squad during the reveal, then duel your way to the hidden flag-bearer.
            Start with two-player mode on this machine or server, and use Claude as the secondary solo option.
          </p>
          <div className="difficulty-list">
            <button type="button" className="difficulty-card" onClick={onChooseOnline}>
              <span>Play 2 Players</span>
              <small>Main mode. Open or join a lobby from two browsers on the same server.</small>
            </button>
            <button type="button" className="difficulty-card" onClick={onChooseAi}>
              <span>Play vs Claude</span>
              <small>Side mode. Solo match against the AI squad.</small>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
