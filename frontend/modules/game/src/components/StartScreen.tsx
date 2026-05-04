interface StartScreenProps {
  difficulties: Array<{ id: string; label: string; detail: string }>;
  selected: string;
  onSelect: (difficulty: any) => void;
  onStart: () => void;
  loading: boolean;
}

export function StartScreen({ difficulties, selected, onSelect, onStart, loading }: StartScreenProps) {
  return (
    <main className="squad-shell">
      <div className="squad-backdrop" />
      <div className="squad-layout">
        <section className="panel setup-panel">
          <p className="eyebrow">Squad RPS</p>
          <h1 className="hero-title">Choose a mode and enter the board.</h1>
          <div className="difficulty-list">
            {difficulties.map((option) => (
              <button
                key={option.id}
                type="button"
                className="difficulty-card"
                onClick={() => onSelect(option.id)}
                aria-pressed={selected === option.id}
              >
                <span>{option.label}</span>
                <small>{option.detail}</small>
              </button>
            ))}
          </div>
          <button type="button" className="primary-button" onClick={onStart} disabled={loading}>
            {loading ? "Working..." : "Start Match"}
          </button>
        </section>
      </div>
    </main>
  );
}
