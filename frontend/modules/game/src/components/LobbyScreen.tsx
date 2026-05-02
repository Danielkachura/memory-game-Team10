import { useEffect, useState } from "react";
import { API_BASE } from "../utils/apiBase";
import { SitePreferences } from "./SitePreferences";

type Difficulty = "easy" | "medium" | "hard";

interface LobbySummary {
  lobbyId: string;
  hostName: string;
  guestName: string | null;
  difficulty: Difficulty;
  status: "open" | "started" | "closed";
  matchId: string | null;
  createdAt: number;
}

interface LobbyHandshake {
  lobbyId: string;
  token: string;
  role: "host" | "guest";
  displayName: string;
  matchId?: string;
  lobby: LobbySummary;
}

interface LobbyScreenProps {
  onMatchReady: (info: { matchId: string; token: string; displayName: string; role: "host" | "guest" }) => void;
  onBack: () => void;
}

const DEFAULT_NAME_KEY = "squad-rps-display-name";

async function postJson<T>(url: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers["x-player-token"] = token;
  const response = await fetch(API_BASE + url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(API_BASE + url);
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

export function LobbyScreen({ onMatchReady, onBack }: LobbyScreenProps) {
  const [displayName, setDisplayName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(DEFAULT_NAME_KEY) ?? "";
  });
  const [lobbies, setLobbies] = useState<LobbySummary[]>([]);
  const [pending, setPending] = useState<LobbyHandshake | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lanUrl, setLanUrl] = useState<string>(typeof window !== "undefined" ? window.location.origin : "");
  const [revealSeconds, setRevealSeconds] = useState<number>(10);

  // Persist display name.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (displayName.trim()) window.localStorage.setItem(DEFAULT_NAME_KEY, displayName.trim());
  }, [displayName]);

  // Fetch the server's LAN IP and combine with the frontend's own port.
  useEffect(() => {
    getJson<{ lanIp: string }>("/api/server-info")
      .then((info) => {
        const { protocol, port } = window.location;
        setLanUrl(`${protocol}//${info.lanIp}${port ? `:${port}` : ""}`);
      })
      .catch(() => setLanUrl(window.location.origin));
  }, []);

  // Poll the open lobby list while we are browsing.
  useEffect(() => {
    if (pending) return undefined;
    let cancelled = false;
    const tick = async () => {
      try {
        const data = await getJson<{ lobbies: LobbySummary[] }>("/api/lobby/list");
        if (!cancelled) setLobbies(data.lobbies);
      } catch {
        // ignore polling errors
      }
    };
    void tick();
    const handle = window.setInterval(tick, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [pending]);

  // Host: poll our own lobby until a guest joins (status=started, matchId set).
  useEffect(() => {
    if (!pending || pending.role !== "host") return undefined;
    let cancelled = false;
    const tick = async () => {
      try {
        const lobby = await getJson<LobbySummary>(`/api/lobby/${pending.lobbyId}`);
        if (cancelled) return;
        if (lobby.status === "started" && lobby.matchId) {
          onMatchReady({
            matchId: lobby.matchId,
            token: pending.token,
            displayName: pending.displayName,
            role: "host",
          });
        }
      } catch {
        // ignore
      }
    };
    void tick();
    const handle = window.setInterval(tick, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [pending, onMatchReady]);

  async function createLobby() {
    if (!displayName.trim()) {
      setError("Pick a display name first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await postJson<LobbyHandshake>("/api/lobby/create", {
        displayName: displayName.trim(),
        difficulty: "medium",
        revealSeconds,
      });
      setPending(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create lobby.");
    } finally {
      setBusy(false);
    }
  }

  async function joinLobby(lobbyId: string) {
    if (!displayName.trim()) {
      setError("Pick a display name first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await postJson<LobbyHandshake>(`/api/lobby/${lobbyId}/join`, {
        displayName: displayName.trim(),
      });
      if (result.matchId) {
        onMatchReady({
          matchId: result.matchId,
          token: result.token,
          displayName: result.displayName,
          role: "guest",
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not join lobby.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelLobby() {
    if (!pending) return;
    try {
      await postJson(`/api/lobby/${pending.lobbyId}/cancel`, {}, pending.token);
    } catch {
      // ignore — best effort
    }
    setPending(null);
  }

  if (pending && pending.role === "host") {
    return (
      <main className="squad-shell">
        <div className="squad-backdrop" />
        <div className="squad-layout">
          <SitePreferences compact />
          <section className="panel setup-panel">
            <p className="eyebrow">Lobby - waiting</p>
            <h1 className="hero-title">Waiting for a challenger…</h1>
            <p className="hero-copy">
              Your lobby is open as <strong>{pending.displayName}</strong>. Share this address with the
              other player so they can join from their browser on the same network:
            </p>
            <code style={{ background: "rgba(0,0,0,0.35)", padding: "8px 12px", borderRadius: 8, wordBreak: "break-all" }}>
              {lanUrl || window.location.origin}
            </code>
            <div className="difficulty-list">
              <button type="button" className="secondary-button" onClick={cancelLobby}>
                Cancel lobby
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="squad-shell">
      <div className="squad-backdrop" />
      <div className="squad-layout">
        <SitePreferences compact />
        <section className="panel setup-panel">
          <p className="eyebrow">Online lobby</p>
          <h1 className="hero-title">Pick a name. Open a room or join one.</h1>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span>Display name</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value.slice(0, 24))}
              placeholder="e.g. Daniel"
              maxLength={24}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(0,0,0,0.3)",
                color: "var(--color-text)",
                fontSize: "1rem",
              }}
            />
          </label>

          <label className="lobby-field">
            <span>Reveal time: {revealSeconds}s</span>
            <input
              type="range"
              min={3}
              max={15}
              step={1}
              value={revealSeconds}
              onChange={(event) => setRevealSeconds(Number(event.target.value))}
              aria-label="Reveal time in seconds"
              style={{ width: "160px", maxWidth: "100%", display: "block" }}
            />
          </label>

          <div className="difficulty-list">
            <button
              type="button"
              className="primary-button"
              onClick={() => void createLobby()}
              disabled={busy}
            >
              {busy ? "Working…" : "Create new lobby"}
            </button>
            <button type="button" className="secondary-button" onClick={onBack}>
              Back to home
            </button>
          </div>

          <div>
            <h2 style={{ margin: "12px 0 8px" }}>Open lobbies</h2>
            {lobbies.length === 0 ? (
              <p className="hero-copy">
                No open lobbies. Create one and share this server URL with the second player.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {lobbies.map((lobby) => (
                  <li
                    key={lobby.lobbyId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div>
                      <strong>{lobby.hostName}</strong>
                      <span style={{ marginLeft: 8, opacity: 0.7 }}>· {lobby.difficulty}</span>
                    </div>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => void joinLobby(lobby.lobbyId)}
                      disabled={busy}
                    >
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error ? <p className="status-error">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
