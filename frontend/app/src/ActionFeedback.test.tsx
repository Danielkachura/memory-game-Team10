import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionFeedback } from "../../modules/game/src/components/ActionFeedback";

describe("ActionFeedback", () => {
  it("renders action hint and auto-clears feedback after three seconds", () => {
    vi.useFakeTimers();
    const onClear = vi.fn();

    render(
      <ActionFeedback
        actionHint="Select a piece."
        feedback={{ tone: "warning", message: "Wait for your turn." }}
        onClear={onClear}
      />,
    );

    expect(screen.getByText("Select a piece.")).toBeInTheDocument();
    expect(screen.getByText("Wait for your turn.")).toHaveClass("action-feedback--warning");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClear).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
