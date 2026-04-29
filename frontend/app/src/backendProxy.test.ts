import { describe, expect, it, vi } from "vitest";
import { handleClaudeProxy } from "../../../backend/modules/claude_proxy/src/api/handleClaudeProxy";
import { validateClaudeProxyRequest } from "../../../backend/modules/claude_proxy/src/validators/request";

describe("backend Claude proxy", () => {
  it("validates accepted proxy requests", () => {
    expect(validateClaudeProxyRequest({ feature: "hint", prompt: "test" })).toEqual({
      feature: "hint",
      prompt: "test",
    });
    expect(() => validateClaudeProxyRequest({ feature: "bad", prompt: "x" })).toThrow();
    expect(() => validateClaudeProxyRequest({ feature: "hint", prompt: "" })).toThrow();
  });

  it("normalizes a successful Anthropic response", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "Proxy success" }] }),
    } as Response);

    await expect(handleClaudeProxy({ feature: "hint", prompt: "go" })).resolves.toEqual({
      text: "Proxy success",
    });

    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
});
