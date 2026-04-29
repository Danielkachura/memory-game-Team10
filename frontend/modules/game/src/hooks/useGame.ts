import { useEffect, useMemo, useRef, useState } from "react";
import { APP_THEME_OPTIONS, DIFFICULTY_OPTIONS, GRID_BY_DIFFICULTY, PAIRS_BY_DIFFICULTY, calculateStars } from "@shared";
import type { Card, Difficulty, GameState, Score, Theme } from "@shared";
import { generateHint, generateNarration, generateThemeContent } from "@ai";
import { buildDeck } from "../utils/buildDeck";
import { matchCheck } from "../utils/matchCheck";

const DEFAULT_DIFFICULTY: Difficulty = "easy";
const DEFAULT_THEME: Theme = "animals";

const INITIAL_STATE: GameState = {
  cards: [],
  flippedIds: [],
  matchedPairs: 0,
  totalPairs: PAIRS_BY_DIFFICULTY[DEFAULT_DIFFICULTY],
  moves: 0,
  timeElapsed: 0,
  status: "idle",
  difficulty: DEFAULT_DIFFICULTY,
  theme: DEFAULT_THEME,
};

type MemoryGameTestWindow = Window & {
  __MEMORY_GAME_TEST__?: {
    flipCard: (cardId: string) => void;
    startGame: (difficulty?: Difficulty, theme?: Theme) => Promise<void>;
    completeGame: () => void;
    getState: () => GameState;
  };
};

function shouldUseOrderedDeck() {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("deck") === "ordered";
}

export function useGame() {
  const [game, setGame] = useState<GameState>(INITIAL_STATE);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(DEFAULT_DIFFICULTY);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(DEFAULT_THEME);
  const [hint, setHint] = useState("Hints will appear here once the game begins.");
  const [hintStatus, setHintStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [narration, setNarration] = useState("Finish the board to unlock your recap.");
  const [narrationStatus, setNarrationStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [timerStarted, setTimerStarted] = useState(false);
  const [isResolvingTurn, setIsResolvingTurn] = useState(false);
  const gameRef = useRef<GameState>(INITIAL_STATE);
  const themeCacheRef = useRef(new Map<string, string[]>());
  const mismatchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (game.status !== "playing" || !timerStarted) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setGame((current) => ({ ...current, timeElapsed: current.timeElapsed + 1 }));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [game.status, timerStarted]);

  useEffect(() => {
    return () => {
      if (mismatchTimeoutRef.current !== null) {
        window.clearTimeout(mismatchTimeoutRef.current);
      }
    };
  }, []);

  const score: Score | null = useMemo(() => {
    if (game.status !== "won") {
      return null;
    }
    return {
      moves: game.moves,
      timeElapsed: game.timeElapsed,
      difficulty: game.difficulty,
      stars: calculateStars(game.difficulty, game.moves),
    };
  }, [game]);

  useEffect(() => {
    if (!score) {
      return;
    }

    let cancelled = false;
    setNarrationStatus("loading");

    generateNarration({
      difficulty: score.difficulty,
      totalPairs: game.totalPairs,
      moves: score.moves,
      timeElapsed: score.timeElapsed,
      stars: score.stars,
    }).then((text: string) => {
      if (!cancelled) {
        setNarration(text);
        setNarrationStatus("ready");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [game.totalPairs, score]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const testWindow = window as MemoryGameTestWindow;
    const params = new URLSearchParams(window.location.search);
    if (params.get("e2e") !== "1") {
      return undefined;
    }

    testWindow.__MEMORY_GAME_TEST__ = {
      flipCard,
      startGame,
      completeGame: () => {
        setGame((current) => ({
          ...current,
          cards: current.cards.map((card) => ({
            ...card,
            isFlipped: true,
            isMatched: true,
          })),
          flippedIds: [],
          matchedPairs: current.totalPairs,
          status: "won",
        }));
        setIsResolvingTurn(false);
      },
      getState: () => gameRef.current,
    };

    return () => {
      delete testWindow.__MEMORY_GAME_TEST__;
    };
  }, [game]);

  async function startGame(difficulty = selectedDifficulty, theme = selectedTheme) {
    if (mismatchTimeoutRef.current !== null) {
      window.clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }

    const cacheKey = `${theme}:${difficulty}`;
    const pairCount = PAIRS_BY_DIFFICULTY[difficulty];
    const generatedContent =
      theme === "custom-ai"
        ? themeCacheRef.current.get(cacheKey) ??
          (await generateThemeContent("custom-ai memory game", pairCount).then((values: string[]) => {
            themeCacheRef.current.set(cacheKey, values);
            return values;
          }))
        : undefined;

    setHint(theme === "custom-ai"
      ? "Custom AI theme loaded. Ask for a hint if you get stuck."
      : "Hints will appear here once you ask for one.");
    setHintStatus("ready");
    setNarration("Finish the board to unlock your recap.");
    setNarrationStatus("idle");
    setTimerStarted(false);
    setIsResolvingTurn(false);

    setGame({
      cards: buildDeck(difficulty, theme, generatedContent, shouldUseOrderedDeck()),
      flippedIds: [],
      matchedPairs: 0,
      totalPairs: pairCount,
      moves: 0,
      timeElapsed: 0,
      status: "playing",
      difficulty,
      theme,
    });
  }

  async function requestHint() {
    if (game.status !== "playing") {
      return;
    }

    if (game.flippedIds.length === 2 || isResolvingTurn) {
      setHint("Let these two cards settle first, then ask again.");
      return;
    }

    setHintStatus("loading");
    const text = await generateHint({
      totalPairs: game.totalPairs,
      matchedPairs: game.matchedPairs,
      moves: game.moves,
    });
    setHint(text);
    setHintStatus("ready");
  }

  function returnToSetup() {
    if (mismatchTimeoutRef.current !== null) {
      window.clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }

    setTimerStarted(false);
    setIsResolvingTurn(false);
    setHint("Hints will appear here once the game begins.");
    setHintStatus("idle");
    setNarration("Finish the board to unlock your recap.");
    setNarrationStatus("idle");
    setGame((current) => ({
      ...INITIAL_STATE,
      difficulty: current.difficulty,
      theme: current.theme,
      totalPairs: PAIRS_BY_DIFFICULTY[current.difficulty],
    }));
  }

  function resolveMatch(cards: Card[]) {
    const [first, second] = cards;
    const isMatch = matchCheck(first, second);

    if (isMatch) {
      setGame((current) => {
        const matchedCards = current.cards.map((card) =>
          current.flippedIds.includes(card.id) ? { ...card, isMatched: true } : card,
        );
        const matchedPairs = current.matchedPairs + 1;
        const won = matchedPairs === current.totalPairs;

        return {
          ...current,
          cards: matchedCards,
          flippedIds: [],
          matchedPairs,
          status: won ? "won" : current.status,
        };
      });
      setIsResolvingTurn(false);
      setHint("Nice catch. Keep the pattern going.");
      setHintStatus("ready");
      return;
    }

    const mismatchedIds = cards.map((card) => card.id);

    mismatchTimeoutRef.current = window.setTimeout(() => {
      setGame((current) => ({
        ...current,
        cards: current.cards.map((card) =>
          mismatchedIds.includes(card.id) ? { ...card, isFlipped: false } : card,
        ),
        flippedIds: current.flippedIds.filter((id) => !mismatchedIds.includes(id)),
      }));
      mismatchTimeoutRef.current = null;
      setIsResolvingTurn(false);
    }, 900);
    setHint("Mismatch recorded. Use it on the next turn.");
    setHintStatus("ready");
  }

  function flipCard(cardId: string) {
    const current = gameRef.current;
    if (current.status !== "playing" || current.flippedIds.length >= 2 || isResolvingTurn) {
      return;
    }

    const targetCard = current.cards.find((card) => card.id === cardId);
    if (!targetCard || targetCard.isFlipped || targetCard.isMatched) {
      return;
    }

    const nextCards = current.cards.map((card) =>
      card.id === cardId ? { ...card, isFlipped: true } : card,
    );
    const nextFlippedIds = [...current.flippedIds, cardId];
    const shouldStartTimer =
      current.flippedIds.length === 0 && current.moves === 0 && current.matchedPairs === 0;
    const shouldResolveTurn = nextFlippedIds.length === 2;
    const nextState = {
      ...current,
      cards: nextCards,
      flippedIds: nextFlippedIds,
      moves: shouldResolveTurn ? current.moves + 1 : current.moves,
    };

    gameRef.current = nextState;
    setGame(nextState);

    if (shouldStartTimer) {
      setTimerStarted(true);
    }

    if (shouldResolveTurn) {
      setIsResolvingTurn(true);
      const pendingCards = nextCards.filter((card) => nextFlippedIds.includes(card.id));
      window.setTimeout(() => resolveMatch(pendingCards), 0);
    }
  }

  return {
    appThemeOptions: APP_THEME_OPTIONS,
    difficultyOptions: DIFFICULTY_OPTIONS,
    grid: GRID_BY_DIFFICULTY[game.difficulty],
    hint,
    hintStatus,
    isResolvingTurn,
    game,
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
  };
}
