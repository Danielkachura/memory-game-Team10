import type { Difficulty } from "@shared";
import type { MemoryTheme } from "@shared/constants/themeContent";

interface ScorePanelProps {
  moves: number;
  timeElapsed: number;
  difficulty: Difficulty;
  theme: MemoryTheme;
  onNewGame: () => void;
  onBackToMenu: () => void;
  onHint: () => void;
  hintDisabled?: boolean;
}

export function ScorePanel(props: ScorePanelProps) {
  const { moves, timeElapsed, difficulty, theme, onNewGame, onBackToMenu, onHint, hintDisabled } = props;

  return (
    <section className="rounded-md border border-white/10 bg-surface p-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap gap-md">
          <Stat label="Moves" value={String(moves)} />
          <Stat label="Time" value={`${timeElapsed}s`} />
          <Stat label="Difficulty" value={difficulty} />
          <Stat label="Theme" value={theme} />
        </div>
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={onBackToMenu}
            className="rounded-sm border border-white/15 px-md py-sm text-sm font-medium text-text transition hover:bg-white/5"
          >
            Main Menu
          </button>
          <button
            type="button"
            onClick={onHint}
            disabled={hintDisabled}
            className="rounded-sm border border-primary px-md py-sm text-sm font-medium text-text transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hint
          </button>
          <button
            type="button"
            onClick={onNewGame}
            className="rounded-sm bg-primary px-md py-sm text-sm font-semibold text-slate-950 transition hover:bg-primary-strong"
          >
            New Game
          </button>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-20 rounded-sm border border-white/10 bg-surface-raised px-md py-sm">
      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</div>
      <div className="mt-1 font-heading text-lg font-semibold capitalize">{value}</div>
    </div>
  );
}
