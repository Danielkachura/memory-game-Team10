import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EventLogPanel } from "../../modules/game/src/components/EventLogPanel";

describe("EventLogPanel", () => {
  it("renders event log entries and can collapse", async () => {
    const user = userEvent.setup();
    render(
      <EventLogPanel
        entries={[
          { turn: 1, message: "Match created." },
          { turn: 2, message: "Player moved." },
        ]}
      />,
    );

    expect(screen.getByTestId("event-log-panel")).toHaveTextContent("Player moved.");

    await user.click(screen.getByRole("button", { name: /Collapse event log/i }));

    expect(screen.queryByText("Player moved.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Expand event log/i })).toBeInTheDocument();
  });
});
