import { AppError } from "./AppError.js";

export class ValidationError extends AppError {
  public readonly statusCode = 422;

  constructor(message = "Validation failed") {
    super(message);
  }
}
