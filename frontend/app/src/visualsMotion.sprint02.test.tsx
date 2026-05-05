import { act, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DuelOverlay } from "../../modules/game/src/components/DuelOverlay";
import { UnitSprite } from "../../modules/game/src/components/UnitSprite";
import { useAudio } from "../../modules/game/src/hooks/useAudio";
import type { VisiblePiece } from "../../modules/game/src/hooks/useGame";

const styles = () => readFileSync(resolve(__dirname, "styles.css"), "utf8");
const source = (path: string) => readFileSync(resolve(__dirname, path), "utf8");

function playerPiece(overrides: Partial<VisiblePiece> = {}): VisiblePiece {
  return {
    id: "player-1",
    owner: "player",
    row: 2,
    col: 2,
    alive: true,
    label: "Rock Soldier",
    weapon: "rock",
    weaponIcon: "rock",
    role: "soldier",
    roleIcon: null,
    silhouette: false,
    ...overrides,
  };
}

function UseAudioHarness({ state }: { state: Parameters<typeof useAudio>[0] }) {
  useAudio(state);
  return null;
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

describe("visuals and motion sprint 02", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it("VM-01 plays turn, duel, win, and loss sounds without double firing unchanged signatures", () => {
    const play = vi.fn().mockResolvedValue(undefined);
    const AudioMock = vi.fn().mockImplementation(() => ({ play, volume: 0 }));
    vi.stubGlobal("Audio", AudioMock);

    const { rerender } = render(
      <UseAudioHarness state={{ phase: "player_turn", currentTurn: "player", duel: null, result: null, showDuel: false }} />,
    );
    expect(AudioMock).toHaveBeenCalledWith("/audio/red_turn.wav.mp4");

    rerender(<UseAudioHarness state={{ phase: "player_turn", currentTurn: "player", duel: null, result: null, showDuel: false }} />);
    expect(AudioMock).toHaveBeenCalledTimes(1);

    rerender(<UseAudioHarness state={{ phase: "ai_turn", currentTurn: "ai", duel: null, result: null, showDuel: false }} />);
    expect(AudioMock).toHaveBeenCalledWith("/audio/blue_turn.wav.mp4");

    rerender(<UseAudioHarness state={{ phase: "player_turn", currentTurn: "player", duel: duel(), result: null, showDuel: true }} />);
    expect(AudioMock).toHaveBeenCalledWith("/audio/battle_start.wav.m4a");

    rerender(<UseAudioHarness state={{ phase: "finished", currentTurn: "none", duel: null, result: { winner: "player" }, showDuel: false }} />);
    expect(AudioMock).toHaveBeenCalledWith("/audio/you_win.wav.mp4");

    rerender(<UseAudioHarness state={{ phase: "finished", currentTurn: "none", duel: null, result: { winner: "ai" }, showDuel: false }} />);
    expect(AudioMock).toHaveBeenCalledWith("/audio/you_lose.wav.mp4");
  });

  it("VM-02 fires attacker and defender weapon sounds on the throw beat, plus tie and winner sounds", () => {
    vi.useFakeTimers();
    const play = vi.fn().mockResolvedValue(undefined);
    const AudioMock = vi.fn().mockImplementation(() => ({ play, volume: 0 }));
    vi.stubGlobal("Audio", AudioMock);

    render(<UseAudioHarness state={{ phase: "player_turn", currentTurn: "player", duel: duel(), result: null, showDuel: true }} />);
    act(() => vi.advanceTimersByTime(300));
    expect(AudioMock).toHaveBeenCalledWith("/audio/rock.wav.mp4");
    vi.advanceTimersByTime(50);
    expect(AudioMock).toHaveBeenCalledWith("/audio/scissors.wav.mp4");
    vi.advanceTimersByTime(100);
    expect(AudioMock).toHaveBeenCalledWith("/audio/jump.wav.mp4");

    render(<UseAudioHarness state={{ phase: "repick", currentTurn: "player", duel: duel({ winner: "tie", tie: true }), result: null, showDuel: true }} />);
    expect(AudioMock).toHaveBeenCalledWith("/audio/shuffle.wav.mp4");
  });

  it("VM-03 gives own alive pieces an idle sway class and CSS keyframes", () => {
    render(<UnitSprite piece={playerPiece()} selected={false} isValidTarget={false} isRevealPhase={false} isDying={false} onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveClass("unit-idle-sway");
    expect(styles()).toContain("@keyframes idleSway");
    expect(styles()).toContain("animation-delay: calc(var(--sway-offset, 0) * 1s)");
  });

  it("VM-04 uses a selection bounce class instead of inline selected transforms", () => {
    render(<UnitSprite piece={playerPiece()} selected isValidTarget={false} isRevealPhase={false} isDying={false} onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveClass("unit-selected");
    expect(styles()).toContain("@keyframes unitSelect");
    expect(source("../../modules/game/src/components/UnitSprite.tsx")).not.toContain('transform: selected ? "scale(1.12)"');
  });

  it("VM-05 starts DuelOverlay in windup, then reveals weapons with weapon-reveal after 300ms", () => {
    vi.useFakeTimers();
    render(<DuelOverlay duel={duel()} visible />);
    expect(screen.getByTestId("duel-windup")).toBeInTheDocument();
    expect(screen.queryByAltText("rock")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByAltText("rock").closest(".weapon-reveal")).toBeTruthy();
    expect(styles()).toContain("@keyframes windUpPose");
    expect(styles()).toContain("@keyframes weaponReveal");
  });

  it("VM-06 flashes winner, shrinks loser, and shakes ties when resolved", () => {
    vi.useFakeTimers();
    render(<DuelOverlay duel={duel()} visible />);
    act(() => vi.advanceTimersByTime(450));
    expect(screen.getByTestId("attacker-weapon-card")).toHaveClass("weapon-winner");
    expect(screen.getByTestId("defender-weapon-card")).toHaveClass("weapon-loser");
    expect(styles()).toContain("@keyframes weaponWin");
    expect(styles()).toContain("@keyframes tieShake");
  });

  it("VM-07 shows character win/lose/tie reactions after resolution", () => {
    vi.useFakeTimers();
    render(<DuelOverlay duel={duel()} visible />);
    act(() => vi.advanceTimersByTime(450));
    expect(screen.getByTestId("duel-reactions")).toBeInTheDocument();
    expect(styles()).toContain("@keyframes charWin");
    expect(styles()).toContain("@keyframes charLose");
    expect(styles()).toContain("@keyframes charTie");
  });

  it("VM-08 supports landing class and minimum 300ms movement timing in GameScreen", () => {
    render(<UnitSprite piece={playerPiece()} selected={false} isValidTarget={false} isRevealPhase={false} isDying={false} isLanding onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveClass("unit-landing");
    expect(styles()).toContain("@keyframes unitLand");
    expect(source("../../modules/game/src/components/GameScreen.tsx")).toContain("300");
  });

  it("VM-09 swaps to fallen pose while dying and defines cell echo", () => {
    render(<UnitSprite piece={playerPiece()} selected={false} isValidTarget={false} isRevealPhase={false} isDying onClick={() => {}} />);
    expect(screen.getByRole("button").querySelector("img")).toHaveAttribute("src", "/character_yellow_fallen_nobg.png");
    expect(styles()).toContain("@keyframes cellEcho");
    expect(source("../../modules/game/src/components/GameScreen.tsx")).toContain("nati-board-cell--echo");
  });

  it("VM-10 defines dead role badges for flag and decoy cells", () => {
    expect(styles()).toContain("@keyframes badgeReveal");
    expect(source("../../modules/game/src/components/GameScreen.tsx")).toContain("cell-role-badge--flag");
    expect(source("../../modules/game/src/components/GameScreen.tsx")).toContain("cell-role-badge--decoy");
  });

  it("VM-11 defines the flag death cinematic overlay and timing", () => {
    expect(styles()).toContain("@keyframes boardDim");
    expect(styles()).toContain("@keyframes flagDrop");
    expect(source("../../modules/game/src/components/GameScreen.tsx")).toContain("showFlagCinematic");
    expect(source("../../modules/game/src/components/GameScreen.tsx")).toContain("900");
  });

  it("VM-12 colors and pulses the reveal timer and wires final-second tick audio", () => {
    expect(styles()).toContain("@keyframes timerUrgent");
    expect(source("../../modules/game/src/components/GameScreen.tsx")).toContain("reveal-timer--urgent");
    expect(source("../../modules/game/src/hooks/useAudio.ts")).toContain("revealSecondsLeft");
    expect(source("../../modules/game/src/hooks/useAudio.ts")).toContain("playTone(600, 80)");
  });

  it("VM-13 supports simultaneous weapon hide fade after reveal", () => {
    render(<UnitSprite piece={playerPiece({ owner: "ai", silhouette: false })} selected={false} isValidTarget={false} isRevealPhase={false} isDying={false} justHidden onClick={() => {}} />);
    expect(screen.getByAltText("rock")).toHaveClass("weapon-hiding");
    expect(styles()).toContain("@keyframes weaponHide");
  });

  it("VM-14 pulses a decoy shield and shows clear invulnerable text", () => {
    vi.useFakeTimers();
    render(<DuelOverlay duel={duel({ revealedRole: "decoy", decoyAbsorbed: true })} visible />);
    act(() => vi.advanceTimersByTime(450));
    expect(screen.getByText(/DECOY.*INVULNERABLE/i)).toBeInTheDocument();
    expect(screen.getByTestId("defender-weapon-shell")).toHaveClass("decoy-shield-pulse");
    expect(styles()).toContain("@keyframes decoyShield");
  });

  it("VM-15 defines AI thinking dots in GameScreen", () => {
    expect(source("../../modules/game/src/components/GameScreen.tsx")).toContain("thinking-indicator");
    expect(source("../../modules/game/src/components/GameScreen.tsx")).toContain("think-dot");
    expect(styles()).toContain("@keyframes thinkDot");
  });
});
