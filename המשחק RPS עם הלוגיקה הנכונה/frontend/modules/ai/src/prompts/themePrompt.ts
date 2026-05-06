export function buildThemePrompt(theme: string, count: number) {
  return `Generate ${count} unique memory card content items for the theme "${theme}".
Return ONLY a JSON array of strings. No explanation, no markdown, no code fences.
Each string should be short: 1 emoji OR 1-3 words maximum.`;
}
