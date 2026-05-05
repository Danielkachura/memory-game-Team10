import { act, fireEvent, render, screen } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DuelOverlay } from "../../modules/game/src/components/DuelOverlay";
import { GameScreen } from "../../modules/game/src/components/GameScreen";
import { UnitSprite } from "../../modules/game/src/components/UnitSprite";
import type { VisiblePiece } from "../../modules/game/src/hooks/useGame";
import type { VisiblePiece as SharedVisiblePiece } from "../../modules/shared/src";

const repoRoot = resolve(__dirname, "../../..");
const source = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

function piece(overrides: Partial<VisiblePiece> = {}): VisiblePiece {
  return {
    id: "ai-1",
    owner: "ai",
    row: 4,
    col: 2,
    alive: true,
    label: "Hidden Operative",
    weapon: "rock",
    weaponIcon: "rock",
    role: "soldier",
    roleIcon: null,
    silhouette: false,
    ...overrides,
  };
}

function duel(overrides = {}) {
  return {
    attackerId: "player-1",
    attackerName: "Rock Soldier",
    attackerWeapon: "rock",
    defenderId: "ai-1",
    defenderName: "Scissors Soldier",
    defenderWeapon: "scissors",
    winner: "attacker",
    tie: false,
    decoyAbsorbed: false,
    ...overrides,
  } as const;
}

function matchWithLog(eventLog: Array<{ turn: number; message: string }>) {
  return {
    matchId: "match-qa-log",
    phase: "player_turn",
    mode: "ai",
    viewer: "player",
    currentTurn: "player",
    difficulty: "easy",
    message: "Your turn.",
    board: [
      {
        id: "player-1",
        owner: "player",
        row: 2,
        col: 2,
        alive: true,
        label: "Rock Soldier",
        weapon: "rock",
        weaponIcon: "R",
        role: "soldier",
        roleIcon: null,
        silhouette: false,
      },
    ],
    stats: {
      durationSeconds: 3,
      playerDuelsWon: 0,
      playerDuelsLost: 0,
      tieSequences: 0,
      decoyAbsorbed: 0,
    },
    revealEndsAt: Date.now() / 1000,
    turnEndsAt: null,
    turnSeconds: 30,
    duel: null,
    result: null,
    eventLog,
  };
}

describe("Sprint 02 QA frontend scenarios", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("QA-F1 renders duel overlay with full IDs, routes weapon art, and handles repick clicks", async () => {
    vi.useFakeTimers();
    const onRepick = vi.fn();
    render(<DuelOverlay duel={duel({ winner: "tie" })} visible repick onRepick={onRepick} />);

    expect(screen.getByTestId("duel-overlay")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByTestId("attacker-weapon-card").querySelector("img")).toHaveAttribute("src", "/character_red_rock_nobg.png");
    expect(screen.getByText("=")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Choose/i })).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: /Choose Rock/i }));
    expect(onRepick).toHaveBeenCalledWith("rock");
  });

  it("QA-F2 confirms deleted GameBoard and MemoryCard files are not imported", () => {
    expect(existsSync(resolve(repoRoot, "frontend/modules/game/src/components/GameBoard.tsx"))).toBe(false);
    expect(existsSync(resolve(repoRoot, "frontend/modules/game/src/components/MemoryCard.tsx"))).toBe(false);
    expect(source("frontend/app/src/App.tsx")).not.toMatch(/GameBoard|MemoryCard/);
    expect(source("frontend/modules/game/src/components/GameScreen.tsx")).not.toMatch(/GameBoard|MemoryCard/);
  });

  it("QA-F3 keeps shared squad types free of legacy memory-game contracts", () => {
    const sharedTypes = source("frontend/modules/shared/src/types/game.ts");
    expect(sharedTypes).not.toMatch(/interface\s+(Card|GameState|GameStatus|Theme|Score)\b/);

    const visiblePiece: SharedVisiblePiece = piece({ id: "shared-piece" });
    expect(visiblePiece.id).toBe("shared-piece");
    expect(source("frontend/app/src/App.tsx")).not.toMatch(/import\s+.*\b(Card|GameState)\b.*from\s+["']@shared/);
  });

  it("QA-F4 reveals dead enemy flag and decoy badges but not soldiers or alive silhouettes", () => {
    const { rerender } = render(
      <UnitSprite piece={piece({ alive: false, role: "flag", roleIcon: "flag", silhouette: false })} selected={false} isValidTarget={false} isRevealPhase={false} isDying={false} onClick={() => {}} />,
    );
    expect(screen.getByTestId("role-badge")).toHaveAccessibleName(/defeated flag/i);

    rerender(<UnitSprite piece={piece({ alive: false, role: "decoy", roleIcon: "decoy", silhouette: false })} selected={false} isValidTarget={false} isRevealPhase={false} isDying={false} onClick={() => {}} />);
    expect(screen.getByTestId("role-badge")).toHaveAccessibleName(/defeated decoy/i);

    rerender(<UnitSprite piece={piece({ alive: false, role: "soldier", silhouette: false })} selected={false} isValidTarget={false} isRevealPhase={false} isDying={false} onClick={() => {}} />);
    expect(screen.queryByTestId("role-badge")).not.toBeInTheDocument();

    rerender(<UnitSprite piece={piece({ alive: true, role: "flag", roleIcon: null, silhouette: true })} selected={false} isValidTarget={false} isRevealPhase={false} isDying={false} onClick={() => {}} />);
    expect(screen.queryByTestId("role-badge")).not.toBeInTheDocument();
  });

  it("QA-F5 shows revealed role banners only for flag and decoy", () => {
    const { rerender } = render(<DuelOverlay duel={duel({ revealedRole: "flag" })} visible />);
    expect(screen.getByTestId("revealed-role-banner")).toHaveTextContent(/flag/i);

    rerender(<DuelOverlay duel={duel({ revealedRole: "decoy" })} visible />);
    expect(screen.getByTestId("revealed-role-banner")).toHaveTextContent(/decoy/i);

    rerender(<DuelOverlay duel={duel({ revealedRole: "soldier" })} visible />);
    expect(screen.queryByTestId("revealed-role-banner")).not.toBeInTheDocument();
  });

  it("QA-F7 renders every event log entry including forced tie and decoy stalemate text", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () =>
        matchWithLog([
          { turn: 1, message: "Match created." },
          { turn: 5, message: "Forced resolution after 5 consecutive ties." },
          { turn: 6, message: "Decoy stalemate: lone decoy is now killable." },
        ]),
    } as Response);

    render(<GameScreen initialMatchId="match-qa-log" token="token" />);

    expect(await screen.findByTestId("debug-log-panel")).toBeInTheDocument();
    expect(screen.getAllByTestId("debug-log-entry")).toHaveLength(3);
    expect(screen.getByText(/Turn 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Forced resolution after 5 consecutive ties/i)).toBeInTheDocument();
    expect(screen.getByText(/Decoy stalemate/i)).toBeInTheDocument();
  });
});
