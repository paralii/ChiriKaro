import { AppError } from "./AppError.js";

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;

  constructor(message = "Forbidden") {
    super(message);
  }
}
