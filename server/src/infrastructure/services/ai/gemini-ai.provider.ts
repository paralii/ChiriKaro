import type { IAIProvider } from "@application/interfaces/services/IAIProvider.ts";
import { InternalServerError, TooManyRequestsError } from "@shared/errors/index.ts";

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
    } catch { throw new InternalServerError("AI provider is temporarily unavailable"); }
    if (response.status === 429) throw new TooManyRequestsError("AI provider rate limit reached. Please retry later.");
    if (!response.ok) throw new InternalServerError("AI provider is temporarily unavailable");
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new InternalServerError("AI provider returned an invalid response"); }
    if (!payload || typeof payload !== "object" || !Array.isArray((payload as GeminiResponse).candidates)) throw new InternalServerError("AI provider returned an invalid response");
    const text = (payload as GeminiResponse).candidates?.[0]?.content?.parts?.map((part) => part.text).find((part): part is string => typeof part === "string");
    if (!text || text.length > 20000) throw new InternalServerError("AI provider returned an invalid response");
    return text;
  }
}
