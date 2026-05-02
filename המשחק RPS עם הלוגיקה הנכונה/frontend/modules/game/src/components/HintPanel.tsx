export function HintPanel({
  hint,
  status,
}: {
  hint: string;
  status?: "idle" | "loading" | "ready";
}) {
  return (
    <section
      data-testid="hint-panel"
      className="rounded-md border border-white/10 bg-surface p-lg"
    >
      <div className="flex items-center justify-between gap-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-secondary">Hint Feed</p>
        {status === "loading" ? <span className="text-xs text-primary">Thinking...</span> : null}
      </div>
      <p className="mt-sm text-sm text-text-muted">{hint}</p>
    </section>
  );
}
