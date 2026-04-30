import { useState } from "react";
import { GameScreen } from "@game/components/GameScreen";
import { HomeScreen } from "@game/components/HomeScreen";
import { LobbyScreen } from "@game/components/LobbyScreen";

type AppMode = "home" | "ai" | "pvp_lobby" | "pvp_match";

interface ActiveMatch {
  matchId: string;
  token: string;
  displayName: string;
  role: "host" | "guest";
}

export function App() {
  const [mode, setMode] = useState<AppMode>("home");
  const [activeMatch, setActiveMatch] = useState<ActiveMatch | null>(null);

  if (mode === "pvp_match" && activeMatch) {
    return (
      <GameScreen
        initialMatchId={activeMatch.matchId}
        token={activeMatch.token}
        onExit={() => {
          setActiveMatch(null);
          setMode("home");
        }}
      />
    );
  }

  if (mode === "pvp_lobby") {
    return (
      <LobbyScreen
        onBack={() => setMode("home")}
        onMatchReady={(info) => {
          setActiveMatch(info);
          setMode("pvp_match");
        }}
      />
    );
  }

  if (mode === "ai") {
    return <GameScreen onExit={() => setMode("home")} />;
  }

  return (
    <HomeScreen
      onChooseAi={() => setMode("ai")}
      onChooseOnline={() => setMode("pvp_lobby")}
    />
  );
}
