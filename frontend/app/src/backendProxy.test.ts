import { afterEach, describe, expect, it, vi } from "vitest";
import { callClaude } from "@ai/services/claudeClient";

describe("Claude client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts feature and prompt to the backend API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ text: "Proxy success" }),
    } as Response);

    await expect(callClaude("hint", "go")).resolves.toBe("Proxy success");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/claude",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ feature: "hint", prompt: "go" }),
      }),
    );
  });

  it("throws on empty backend text responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await expect(callClaude("hint", "go")).rejects.toThrow("Claude proxy returned empty text.");
  });
});
