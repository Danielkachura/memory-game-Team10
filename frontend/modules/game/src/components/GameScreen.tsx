import { useGame } from "../hooks/useGame";
import { GameBoard } from "./GameBoard";
import { GameSetup } from "./GameSetup";
import { HintPanel } from "./HintPanel";
import { ScorePanel } from "./ScorePanel";
import { WinScreen } from "./WinScreen";

export function GameScreen() {
  const {
    appThemeOptions,
    difficultyOptions,
    game,
    grid,
    hint,
    hintStatus,
    isResolvingTurn,
    narration,
    narrationStatus,
    score,
    selectedDifficulty,
    selectedTheme,
    setSelectedDifficulty,
    setSelectedTheme,
    startGame,
    returnToSetup,
    requestHint,
    flipCard,
  } = useGame();

  return (
    <main className="min-h-screen bg-bg px-md py-lg text-text sm:px-lg sm:py-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-lg">
        {game.status === "idle" ? (
          <GameSetup
            difficulty={selectedDifficulty}
            theme={selectedTheme}
            onDifficultyChange={setSelectedDifficulty}
            onThemeChange={setSelectedTheme}
            onStart={() => void startGame()}
            difficultyOptions={difficultyOptions}
            themeOptions={appThemeOptions}
          />
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-md">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary">Team 10 Memory Loop</p>
                <h1 className="font-heading text-4xl font-bold">Memory Game</h1>
              </div>
              <div className="text-sm text-text-muted">{`${grid.label} grid - ${game.totalPairs} pairs`}</div>
            </header>

            <ScorePanel
              moves={game.moves}
              timeElapsed={game.timeElapsed}
              difficulty={game.difficulty}
              theme={game.theme}
              onNewGame={() => void startGame(game.difficulty, game.theme)}
              onBackToMenu={returnToSetup}
              onHint={() => void requestHint()}
              hintDisabled={hintStatus === "loading"}
            />

            <section className="grid gap-lg lg:grid-cols-[1.2fr_0.8fr]">
              <GameBoard
                cards={game.cards}
                difficulty={game.difficulty}
                onFlip={flipCard}
                locked={game.flippedIds.length === 2 || isResolvingTurn}
              />
              <div className="flex flex-col gap-lg">
                <HintPanel hint={hint} status={hintStatus} />
                {score ? (
                  <WinScreen
                    score={score}
                    recap={narration}
                    recapLoading={narrationStatus === "loading"}
                    onPlayAgain={() => void startGame()}
                  />
                ) : null}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
