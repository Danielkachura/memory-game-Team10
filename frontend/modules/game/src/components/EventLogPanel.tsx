import { useEffect, useRef, useState } from "react";

interface EventLogEntry {
  turn: number;
  message: string;
}

interface EventLogPanelProps {
  entries?: EventLogEntry[];
}

export function EventLogPanel({ entries = [] }: EventLogPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const latestRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof latestRef.current?.scrollIntoView === "function") {
      latestRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [entries.length, collapsed]);

  return (
    <section className="event-log-panel" data-testid="event-log-panel">
      <div className="event-log-panel__header">
        <h2>Event Log</h2>
        <button
          type="button"
          className="secondary-button event-log-panel__toggle"
          aria-label={collapsed ? "Expand event log" : "Collapse event log"}
          onClick={() => setCollapsed((current) => !current)}
        >
          {collapsed ? "+" : "-"}
        </button>
      </div>
      {!collapsed ? (
        <div className="event-log-panel__list">
          {entries.length > 0 ? (
            entries.map((entry, index) => (
              <div
                key={`${entry.turn}-${entry.message}`}
                ref={index === entries.length - 1 ? latestRef : undefined}
                className="event-log-panel__entry"
              >
                <span>Turn {entry.turn}</span>
                <p>{entry.message}</p>
              </div>
            ))
          ) : (
            <p>No moves logged yet.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
