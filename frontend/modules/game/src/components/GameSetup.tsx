import type { Difficulty } from "@shared";
import type { MemoryTheme } from "@shared/constants/themeContent";

interface GameSetupProps {
  difficulty: Difficulty;
  theme: MemoryTheme;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onThemeChange: (theme: MemoryTheme) => void;
  onStart: () => void;
  difficultyOptions: Array<{ id: Difficulty; label: string; gridLabel: string; pairs: number }>;
  themeOptions: Array<{ id: MemoryTheme; label: string; description: string }>;
}

export function GameSetup(props: GameSetupProps) {
  const {
    difficulty,
    theme,
    onDifficultyChange,
    onThemeChange,
    onStart,
    difficultyOptions,
    themeOptions,
  } = props;

  return (
    <section className="grid gap-lg lg:grid-cols-[1.1fr_0.9fr]">
      <article className="rounded-md border border-white/10 bg-surface p-lg">
        <p className="mb-sm text-sm uppercase tracking-[0.3em] text-primary">Sprint 1 MVP</p>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,4.75rem)] font-bold">Memory Game</h1>
        <p className="mt-md max-w-xl text-text-muted">
          Flip cards, lock in the pairs, and finish with the fewest moves you can manage.
          Claude features will layer on top of this loop, but the game already plays fully in-browser.
        </p>
      </article>

      <article className="rounded-md border border-white/10 bg-surface p-lg">
        <div className="space-y-lg">
          <div>
            <h2 className="font-heading text-xl font-bold">Choose difficulty</h2>
            <div className="mt-md grid gap-sm sm:grid-cols-3">
              {difficultyOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onDifficultyChange(option.id)}
                  className={`rounded-sm border px-md py-md text-left transition ${
                    difficulty === option.id
                      ? "border-primary bg-primary/15"
                      : "border-white/10 bg-surface-raised hover:border-primary/40"
                  }`}
                >
                  <div className="font-heading text-lg font-semibold capitalize">{option.label}</div>
                  <div className="text-sm text-text-muted">
                    {option.gridLabel} · {option.pairs} pairs
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-heading text-xl font-bold">Choose theme</h2>
            <div className="mt-md grid gap-sm">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onThemeChange(option.id)}
                  className={`rounded-sm border px-md py-md text-left transition ${
                    theme === option.id
                      ? "border-primary bg-primary/15"
                      : "border-white/10 bg-surface-raised hover:border-primary/40"
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-text-muted">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onStart}
            className="w-full rounded-sm bg-primary px-lg py-md font-heading text-lg font-semibold text-slate-950 transition hover:bg-primary-strong"
          >
            Start New Game
          </button>
        </div>
      </article>
    </section>
  );
}
