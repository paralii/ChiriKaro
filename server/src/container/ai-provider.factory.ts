import type { IAIProvider } from "@application/interfaces/services/IAIProvider.ts";
import { GeminiAIProvider } from "@infrastructure/services/ai/gemini-ai.provider.ts";

export function createAIProvider(providerName: string, configuration: { apiKey: string; model: string }): IAIProvider {
  switch (providerName) {
    case "gemini": return new GeminiAIProvider(configuration.apiKey, configuration.model);
    default: throw new Error(`Unsupported AI_PROVIDER: ${providerName}`);
  }
}
