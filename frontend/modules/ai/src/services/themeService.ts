import { CUSTOM_AI_FALLBACK_CONTENT } from "@shared";
import { buildThemePrompt } from "../prompts/themePrompt";
import { callClaude } from "./claudeClient";

function parseThemeArray(text: string) {
  const parsed = JSON.parse(text) as unknown;
  if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== "string")) {
    throw new Error("Theme response was not a string array.");
  }
  return parsed as string[];
}

export async function generateThemeContent(themeName: string, count: number) {
  try {
    const text = await callClaude("theme", buildThemePrompt(themeName, count));
    const items = parseThemeArray(text).slice(0, count);
    if (items.length < count) {
      throw new Error("Theme response returned too few items.");
    }
    return items;
  } catch {
    return CUSTOM_AI_FALLBACK_CONTENT.slice(0, count);
  }
}
