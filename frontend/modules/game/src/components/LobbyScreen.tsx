import { useEffect, useState } from "react";
import { API_BASE } from "../utils/apiBase";
import { SettingsPanel } from "./SettingsPanel";

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (displayName.trim()) window.localStorage.setItem(DEFAULT_NAME_KEY, displayName.trim());
  }, [displayName]);

  useEffect(() => {
    getJson<{ lanIp: string }>("/api/server-info")
      .then((info) => {
        const { protocol, port } = window.location;
        setLanUrl(`${protocol}//${info.lanIp}${port ? `:${port}` : ""}`);
      })
      .catch(() => setLanUrl(window.location.origin));
  }, []);

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
      // ignore - best effort
    }
    setPending(null);
  }

  if (pending && pending.role === "host") {
    return (
      <main className="squad-shell">
        <div className="squad-backdrop" />
        <div className="squad-layout">
          <div className="shell-toolbar">
            <SettingsPanel />
          </div>
          <section className="panel setup-panel">
            <p className="eyebrow">Lobby - waiting</p>
            <h1 className="hero-title">Waiting for a challenger...</h1>
            <p className="hero-copy">
              Your lobby is open as <strong>{pending.displayName}</strong>. Share this address with the
              other player so they can join from their browser on the same network:
            </p>
            <code className="lobby-link-box">{lanUrl || window.location.origin}</code>
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
        <div className="shell-toolbar">
          <SettingsPanel />
        </div>
        <section className="panel setup-panel">
          <p className="eyebrow">Online lobby</p>
          <h1 className="hero-title">Pick a name. Open a room or join one.</h1>

          <label className="lobby-field">
            <span>Display name</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value.slice(0, 24))}
              placeholder="e.g. John"
              maxLength={24}
              className="lobby-input"
            />
          </label>

          <div className="difficulty-list">
            <button type="button" className="primary-button" onClick={() => void createLobby()} disabled={busy}>
              {busy ? "Working..." : "Create new lobby"}
            </button>
            <button type="button" className="secondary-button" onClick={onBack}>
              Back to home
            </button>
          </div>

          <div>
            <h2 style={{ margin: "12px 0 8px" }}>Open lobbies</h2>
            {lobbies.length === 0 ? (
              <p className="hero-copy">No open lobbies. Create one and share this server URL with the second player.</p>
            ) : (
              <ul className="lobby-list">
                {lobbies.map((lobby) => (
                  <li key={lobby.lobbyId} className="lobby-list__item">
                    <div>
                      <strong>{lobby.hostName}</strong>
                      <span className="lobby-list__meta"> - {lobby.difficulty}</span>
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
