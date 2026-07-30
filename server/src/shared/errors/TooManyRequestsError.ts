import { AppError } from "./AppError.js";

export class TooManyRequestsError extends AppError {
  public readonly statusCode = 429;

  constructor(message = "Too many requests") {
    super(message);
  }
}
