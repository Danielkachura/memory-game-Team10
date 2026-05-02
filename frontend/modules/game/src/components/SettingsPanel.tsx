import { useState } from "react";
import { audioManager, type AudioMode } from "../utils/audioManager";

interface SettingsPanelProps {
  showDebugLog?: boolean;
  onShowDebugLogChange?: (next: boolean) => void;
}

const AUDIO_OPTIONS: Array<{ value: AudioMode; label: string; detail: string }> = [
  { value: "all", label: "Music + SFX", detail: "Full soundtrack and battle sounds." },
  { value: "sfx", label: "Only SFX", detail: "Keep turns and duel sounds, mute music." },
  { value: "muted", label: "Nothing", detail: "Mute the entire game audio layer." },
];

export function SettingsPanel({ showDebugLog, onShowDebugLogChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [audioMode, setAudioMode] = useState<AudioMode>(() => audioManager.getMode());

  function handleAudioModeChange(mode: AudioMode) {
    setAudioMode(mode);
    audioManager.setMode(mode);
  }

  return (
    <div className="settings-widget">
      <button
        type="button"
        className="secondary-button settings-toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        Settings
      </button>

      {open ? (
        <section className="settings-panel panel" aria-label="Settings panel">
          <div className="settings-panel__header">
            <div>
              <p className="eyebrow">Control Room</p>
              <h2 className="settings-panel__title">Settings</h2>
            </div>
            <button type="button" className="secondary-button settings-panel__close" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <div className="settings-panel__group">
            <span className="settings-panel__label">Audio</span>
            <div className="settings-panel__options">
              {AUDIO_OPTIONS.map((option) => (
                <label key={option.value} className={`settings-option ${audioMode === option.value ? "settings-option--active" : ""}`}>
                  <input
                    type="radio"
                    name="audio-mode"
                    value={option.value}
                    checked={audioMode === option.value}
                    onChange={() => handleAudioModeChange(option.value)}
                  />
                  <span className="settings-option__copy">
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {typeof showDebugLog === "boolean" && onShowDebugLogChange ? (
            <div className="settings-panel__group">
              <span className="settings-panel__label">Extra</span>
              <label className="settings-check">
                <input
                  type="checkbox"
                  checked={showDebugLog}
                  onChange={(event) => onShowDebugLogChange(event.target.checked)}
                />
                <span>
                  <strong>Show match log</strong>
                  <small>Hide the debug/event feed when you want a cleaner board view.</small>
                </span>
              </label>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
