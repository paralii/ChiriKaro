import type { IAIProvider } from "@application/interfaces/services/IAIProvider.ts";
import { InternalServerError, RetryableAIProviderError, TooManyRequestsError } from "@shared/errors/index.ts";

const safeRetryDelay = (header: string | null): number | undefined => {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(3600, Math.ceil(seconds));
  const date = Date.parse(header);
  if (!Number.isFinite(date)) return undefined;
  return Math.min(3600, Math.max(0, Math.ceil((date - Date.now()) / 1000)));
};

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> };
export class GeminiAIProvider implements IAIProvider {
  constructor(private readonly apiKey: string, private readonly model: string, private readonly timeoutMs = 25000) {}
  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) throw new InternalServerError("AI provider is not configured");
    let response: Response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch { throw new RetryableAIProviderError(); }
    if (response.status === 429) throw new TooManyRequestsError("AI provider rate limit reached. Please retry later.", safeRetryDelay(response.headers.get("retry-after")));
    if (response.status >= 500) throw new RetryableAIProviderError("AI provider is temporarily unavailable", safeRetryDelay(response.headers.get("retry-after")));
    if (!response.ok) throw new InternalServerError("AI provider request could not be completed");
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new RetryableAIProviderError("AI provider returned an invalid response"); }
    if (!payload || typeof payload !== "object" || !Array.isArray((payload as GeminiResponse).candidates)) throw new RetryableAIProviderError("AI provider returned an invalid response");
    const text = (payload as GeminiResponse).candidates?.[0]?.content?.parts?.map((part) => part.text).find((part): part is string => typeof part === "string");
    if (!text || text.length > 20000) throw new RetryableAIProviderError("AI provider returned an invalid response");
    return text;
  }
}
