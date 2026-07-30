import { AppError } from "./AppError.js";

export class BadRequestError extends AppError {
  public readonly statusCode = 400;

  constructor(message = "Bad request", errors?: Record<string, string[]>) {
    super(message, errors);
  }
}
