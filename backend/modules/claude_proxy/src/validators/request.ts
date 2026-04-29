const ALLOWED_FEATURES = ["theme", "hint", "narrator"] as const;

export type ClaudeFeature = (typeof ALLOWED_FEATURES)[number];

export interface ClaudeProxyRequest {
  feature: ClaudeFeature;
  prompt: string;
}

export function validateClaudeProxyRequest(input: unknown): ClaudeProxyRequest {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid request body.");
  }

  const candidate = input as Record<string, unknown>;
  const { feature, prompt } = candidate;

  if (typeof feature !== "string" || !ALLOWED_FEATURES.includes(feature as ClaudeFeature)) {
    throw new Error("Unsupported Claude feature.");
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("Prompt is required.");
  }

  return { feature: feature as ClaudeFeature, prompt };
}
