declare const ALLOWED_FEATURES: readonly ["theme", "hint", "narrator"];
export type ClaudeFeature = (typeof ALLOWED_FEATURES)[number];
export interface ClaudeProxyRequest {
    feature: ClaudeFeature;
    prompt: string;
}
export declare function validateClaudeProxyRequest(input: unknown): ClaudeProxyRequest;
export {};
