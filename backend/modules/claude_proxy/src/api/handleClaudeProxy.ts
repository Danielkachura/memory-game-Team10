import { callAnthropic } from "../services/anthropicService";
import { validateClaudeProxyRequest } from "../validators/request";

export async function handleClaudeProxy(rawBody: unknown) {
  const request = validateClaudeProxyRequest(rawBody);
  const text = await callAnthropic(request.feature, request.prompt);
  return { text };
}
