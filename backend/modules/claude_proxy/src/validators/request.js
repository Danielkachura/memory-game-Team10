var ALLOWED_FEATURES = ["theme", "hint", "narrator"];
export function validateClaudeProxyRequest(input) {
    if (!input || typeof input !== "object") {
        throw new Error("Invalid request body.");
    }
    var candidate = input;
    var feature = candidate.feature, prompt = candidate.prompt;
    if (typeof feature !== "string" || !ALLOWED_FEATURES.includes(feature)) {
        throw new Error("Unsupported Claude feature.");
    }
    if (typeof prompt !== "string" || !prompt.trim()) {
        throw new Error("Prompt is required.");
    }
    return { feature: feature, prompt: prompt };
}
