import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../modules/shared/src"),
      "@game": path.resolve(__dirname, "../modules/game/src"),
      "@ui": path.resolve(__dirname, "../modules/ui/src"),
      "@ai": path.resolve(__dirname, "../modules/ai/src"),
    },
  },
  server: {
    port: 5173,
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
    include: ["./src/**/*.test.{ts,tsx}"],
    exclude: ["../../tests/e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "dist/"],
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
});
