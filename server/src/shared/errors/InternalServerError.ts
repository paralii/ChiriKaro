import { AppError } from "./AppError.js";

export class InternalServerError extends AppError {
  public readonly statusCode = 500;

  constructor(message = "Internal server error") {
    super(message);
  }
}
