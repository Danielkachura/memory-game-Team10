import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../modules/shared/src"),
      "@game":   path.resolve(__dirname, "../modules/game/src"),
    },
  },

  server: {
    port: 5173,
    fs: { allow: ["..", "../..", "../../main_menu_asset.png"] },
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_URL ?? "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "clover", "json"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      include: ["src/**/*.{ts,tsx}", "../modules/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/test/setup.ts", "**/main.tsx"],
      all: true,
    },
    include: [
      "./src/**/*.test.{ts,tsx}",
      "../modules/**/*.test.{ts,tsx}",
    ],
    exclude: ["../../tests/e2e/**", "node_modules/**", "dist/**"],
  },
});
