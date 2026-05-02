import { useEffect, useState } from "react";

const THEME_KEY = "squad-rps-site-theme";
export type SiteTheme = "blue" | "ember" | "midnight";

const THEME_OPTIONS: Array<{ id: SiteTheme; label: string; accent: string; note: string }> = [
  { id: "blue", label: "Ocean", accent: "#38bdf8", note: "Cooler blue tones." },
  { id: "ember", label: "Ember", accent: "#f2cf88", note: "Warmer Nati-style tones." },
  { id: "midnight", label: "Midnight", accent: "#a78bfa", note: "Deep contrast with violet accents." },
];

export function applySiteTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.siteTheme = theme;
}

export function readSiteTheme(): SiteTheme {
  if (typeof window === "undefined") return "ember";
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "blue" || stored === "ember" || stored === "midnight" ? stored : "ember";
}

interface SitePreferencesProps {
  compact?: boolean;
}

export function SitePreferences({ compact }: SitePreferencesProps) {
  const [theme, setTheme] = useState<SiteTheme>(() => readSiteTheme());

  useEffect(() => {
    applySiteTheme(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_KEY, theme);
    }
  }, [theme]);

  return (
    <section className={`site-preferences ${compact ? "site-preferences--compact" : ""}`} aria-label="Site preferences">
      <div className="site-preferences__title">Theme</div>
      <div className="site-preferences__options" role="radiogroup" aria-label="Theme selector">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={theme === option.id}
            className={`site-preferences__option ${theme === option.id ? "site-preferences__option--active" : ""}`}
            onClick={() => setTheme(option.id)}
            style={{ ["--theme-accent" as never]: option.accent }}
          >
            <strong>{option.label}</strong>
            <small>{option.note}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
