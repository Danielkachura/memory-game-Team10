import type { ClaudeFeature } from "../validators/request";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS: Record<ClaudeFeature, number> = {
  theme: 300,
  hint: 150,
  narrator: 100,
};

export async function callAnthropic(feature: ClaudeFeature, prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS[feature],
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = payload.content?.find((item) => item.type === "text")?.text?.trim();

    if (!text) {
      throw new Error("Anthropic returned no text.");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}
