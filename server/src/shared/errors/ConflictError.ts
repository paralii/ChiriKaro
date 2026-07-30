import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  public readonly statusCode = 409;

  constructor(message = "Conflict") {
    super(message);
  }
}
