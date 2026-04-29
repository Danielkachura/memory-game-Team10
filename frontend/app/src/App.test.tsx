import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { App } from "./App";

async function startGame() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "Start New Game" }));
  return user;
}

describe("App", () => {
  it("renders real flag emoji for the flags theme", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Flags Country flag matching challenges." }));
    await user.click(screen.getByRole("button", { name: "Start New Game" }));

    await user.click(screen.getAllByRole("button", { name: /Card .* face down/i })[0]);

    expect(screen.getAllByText("\u{1F1EF}\u{1F1F5}").length).toBeGreaterThan(0);
    expect(screen.queryByText("JP")).not.toBeInTheDocument();
    expect(screen.queryByText("KR")).not.toBeInTheDocument();
    expect(screen.queryByText("GB")).not.toBeInTheDocument();
  });

  it("starts a new game from the setup screen", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Memory Game" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start New Game" }));

    expect(screen.getByText("Moves")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hint/i })).toBeInTheDocument();
  });

  it("returns to the setup screen from an active game", async () => {
    const user = await startGame();

    await user.click(screen.getByRole("button", { name: "Main Menu" }));

    expect(screen.getByRole("button", { name: "Start New Game" })).toBeInTheDocument();
    expect(screen.queryByText("Moves")).not.toBeInTheDocument();
  });

  it("locks the board while resolving a mismatch", async () => {
    const user = await startGame();
    const cards = screen.getAllByRole("button", { name: /Card .* face down/i });

    await user.click(cards[0]);

    const firstPairId = cards[0].getAttribute("data-pair-id");
    let mismatchPartner = cards.find(
      (candidate) => candidate.getAttribute("data-pair-id") !== firstPairId,
    )!;

    await user.click(mismatchPartner);

    const unresolved = screen.getAllByRole("button", { name: /face up/i });
    expect(unresolved).toHaveLength(2);

    const lockedCard = cards.find(
      (candidate) => candidate !== cards[0] && candidate !== mismatchPartner,
    )!;
    expect(lockedCard).toBeDisabled();
  });

  it("keeps the timer at zero until the first flip", () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start New Game" }));

    expect(screen.getByText("0s")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("0s")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("keeps hint requests from mutating the board state", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Start New Game" }));

    const before = screen.getAllByRole("button", { name: /face down/i }).length;
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    const after = screen.getAllByRole("button", { name: /face down/i }).length;

    expect(after).toBe(before);
    await act(async () => {
      await Promise.resolve();
    });
    expect(
      screen.getByText(/Trust your freshest memory|sweep the edges before the center/i),
    ).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
