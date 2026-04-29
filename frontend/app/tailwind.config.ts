import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../modules/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        "bg-accent": "var(--color-bg-accent)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        primary: "var(--color-primary)",
        "primary-strong": "var(--color-primary-strong)",
        secondary: "var(--color-secondary)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        "card-back": "var(--color-card-back)",
        "card-face": "var(--color-card-face)",
      },
      fontFamily: {
        heading: ['"Space Grotesk"', '"Trebuchet MS"', "sans-serif"],
        body: ['"Manrope"', '"Segoe UI"', "sans-serif"],
        emoji: ['"Apple Color Emoji"', '"Segoe UI Emoji"', "sans-serif"],
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      spacing: {
        "2xs": "var(--space-2xs)",
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        "2xl": "var(--space-2xl)",
      },
    },
  },
  plugins: [],
} satisfies Config;
