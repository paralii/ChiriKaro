import { AppError } from "./AppError.js";

export class TooManyRequestsError extends AppError {
  public readonly statusCode = 429;

  constructor(message = "Too many requests", public readonly retryAfterSeconds?: number) {
    super(message);
  }
}
