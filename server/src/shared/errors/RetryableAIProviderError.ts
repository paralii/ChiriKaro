import { AppError } from "./AppError.js";

export class RetryableAIProviderError extends AppError {
  public readonly statusCode = 503;
  public readonly retryAfterSeconds?: number;
  constructor(message = "AI provider is temporarily unavailable", retryAfterSeconds?: number) {
    super(message);
    if (typeof retryAfterSeconds === "number" && Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) this.retryAfterSeconds = Math.min(3600, Math.ceil(retryAfterSeconds));
  }
}
