type ClaudeFeature = "theme" | "hint" | "narrator";

export async function callClaude(feature: ClaudeFeature, prompt: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/claude", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ feature, prompt }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Claude proxy failed with ${response.status}.`);
    }

    const payload = (await response.json()) as { text?: string };
    if (!payload.text) {
      throw new Error("Claude proxy returned empty text.");
    }

    return payload.text;
  } finally {
    window.clearTimeout(timeout);
  }
}
