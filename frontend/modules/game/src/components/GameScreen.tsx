import { useGame } from "../hooks/useGame";
import { useAudio } from "../hooks/useAudio";
import { GameBoard } from "./GameBoard";
import { PlayerNameLabel } from "./PlayerNameLabel";
import { Sidebar } from "./Sidebar";
import { DuelOverlay } from "./DuelOverlay";
import { GameOverScreen } from "./GameOverScreen";
import { StartScreen } from "./StartScreen";
import { RefereePanel } from "./RefereePanel";

export function GameScreen() {
  const {
    boardCells,
    match,
    phase,
    selectedPieceId,
    movingPieceId,
    validMoveSet,
    error,
    loading,
    revealSecondsLeft,
    difficulties,
    selectedDifficulty,
    showDuel,
    dyingIds,
    setSelectedDifficulty,
    onPieceClick,
    onCellClick,
    startMatch,
    resetToSetup,
    submitRepick,
  } = useGame();

  useAudio(match ? {
    phase,
    currentTurn: match.currentTurn,
    duel:        match.duel,
    result:      match.result,
    showDuel,
  } : null);

  // ── Start screen ─────────────────────────────────────────────
  if (phase === "setup" || !match) {
    return (
      <StartScreen
        difficulties={difficulties}
        selected={selectedDifficulty}
        onSelect={setSelectedDifficulty}
        onStart={startMatch}
        loading={loading}
      />
    );
  }

  // ── Error screen ─────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        minHeight:      "100vh",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexDirection:  "column",
        gap:            "16px",
        background:     "var(--color-board-bg)",
      }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", color: "var(--color-danger)" }}>
          ⚠️ Error
        </div>
        <div style={{
          fontFamily: "var(--font-ui)",
          color:      "var(--color-text-muted)",
          maxWidth:   "420px",
          textAlign:  "center",
          fontSize:   "0.88rem",
          lineHeight: "1.6",
        }}>
          {error}
        </div>
        <button
          type="button"
          onClick={resetToSetup}
          style={{
            fontFamily:   "var(--font-heading)",
            fontSize:     "1rem",
            padding:      "10px 28px",
            background:   "var(--color-logo-text)",
            color:        "#1a3a00",
            border:       "none",
            borderRadius: "var(--radius-sm)",
            cursor:       "pointer",
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // ── Main game screen ──────────────────────────────────────────
  return (
    <div style={{
      minHeight:      "100vh",
      background:     "var(--color-board-bg)",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
    }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>

        {/* Board column */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <PlayerNameLabel name="AI SQUAD" team="ai" />

          {/* Board + overlays */}
          <div style={{ position: "relative" }}>
            <GameBoard
              boardCells={boardCells}
              selectedPieceId={selectedPieceId}
              movingPieceId={movingPieceId}
              validMoveSet={validMoveSet}
              phase={phase}
              dyingIds={dyingIds}
              onPieceClick={onPieceClick}
              onCellClick={onCellClick}
            />

            {/* Reveal banner */}
            {phase === "reveal" && (
              <div style={{
                position:      "absolute",
                top:           0,
                left:          0,
                right:         0,
                padding:       "7px",
                background:    "rgba(80,40,0,0.7)",
                fontFamily:    "var(--font-heading)",
                fontSize:      "1rem",
                color:         "var(--color-warning)",
                textAlign:     "center",
                letterSpacing: "2px",
                pointerEvents: "none",
                animation:     "pulse 1s ease infinite",
              }}>
                👁 MEMORIZE ENEMY WEAPONS — {revealSecondsLeft}s
              </div>
            )}

            {/* AI turn banner */}
            {phase === "ai_turn" && !showDuel && (
              <div style={{
                position:      "absolute",
                top:           0,
                left:          0,
                right:         0,
                padding:       "7px",
                background:    "rgba(0,0,60,0.7)",
                fontFamily:    "var(--font-heading)",
                fontSize:      "1rem",
                color:         "var(--color-label-cpu)",
                textAlign:     "center",
                letterSpacing: "2px",
                pointerEvents: "none",
              }}>
                🤖 AI IS CHOOSING...
              </div>
            )}

            {/* Duel overlay */}
            {match.duel && <DuelOverlay duel={match.duel} visible={showDuel} repick={phase === "repick"} onRepick={submitRepick} />}

            {/* Game over overlay */}
            {phase === "finished" && match.result && !showDuel && (
              <GameOverScreen
                result={match.result}
                stats={match.stats}
                difficulty={match.difficulty}
                onPlayAgain={resetToSetup}
              />
            )}
          </div>

          <PlayerNameLabel name="YOUR SQUAD" team="player" />

          {/* Instruction hint */}
          <div style={{
            fontFamily: "var(--font-ui)",
            fontSize:   "0.78rem",
            color:      "var(--color-text-muted)",
            marginTop:  "5px",
            minHeight:  "1.2em",
            textAlign:  "center",
          }}>
            {match.message}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <Sidebar
            phase={phase}
            revealTimer={revealSecondsLeft}
            stats={match.stats}
            match={match}
            difficulty={match.difficulty}
          />
          <RefereePanel
            phase={phase}
            currentTurn={match.currentTurn}
            showDuel={showDuel}
            result={match.result}
          />
        </div>
      </div>
    </div>
  );
}
