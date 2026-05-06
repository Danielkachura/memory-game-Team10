import type { Score } from "@shared";

interface WinScreenProps {
  score: Score;
  onPlayAgain: () => void;
  recap: string;
  recapLoading?: boolean;
}

export function WinScreen({ score, onPlayAgain, recap, recapLoading }: WinScreenProps) {
  return (
    <section
      data-testid="win-screen"
      className="rounded-md border border-success/40 bg-surface p-lg"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-success">Board Cleared</p>
      <h2 className="mt-sm font-heading text-3xl font-bold">You matched them all.</h2>
      <div className="mt-md flex flex-wrap gap-md">
        <Badge label="Moves" value={String(score.moves)} />
        <Badge label="Time" value={`${score.timeElapsed}s`} />
        <Badge label="Stars" value={"*".repeat(score.stars)} />
      </div>
      <p className="mt-md text-text-muted">
        {recapLoading ? "Claude recap is loading..." : recap}
      </p>
      <button
        type="button"
        onClick={onPlayAgain}
        className="mt-lg rounded-sm bg-primary px-lg py-md font-semibold text-slate-950 transition hover:bg-primary-strong"
      >
        Play Again
      </button>
    </section>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/10 bg-surface-raised px-md py-sm">
      <div className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</div>
      <div className="mt-1 font-heading text-lg font-semibold">{value}</div>
    </div>
  );
}
