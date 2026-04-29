import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { handleClaudeProxy } from "../../backend/modules/claude_proxy/src/api/handleClaudeProxy";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "memory-game-claude-proxy",
      configureServer(server) {
        server.middlewares.use("/api/claude", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end("Method Not Allowed");
            return;
          }

          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });
          req.on("end", async () => {
            try {
              const payload = body ? JSON.parse(body) : {};
              const result = await handleClaudeProxy(payload);
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 400;
              res.setHeader("content-type", "application/json");
              res.end(
                JSON.stringify({
                  error: error instanceof Error ? error.message : "Claude proxy failed.",
                }),
              );
            }
          });
        });
      },
    },
  ],
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
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    include: ["./src/**/*.test.{ts,tsx}"],
    exclude: ["../../tests/e2e/**", "node_modules/**", "dist/**"],
  },
});
