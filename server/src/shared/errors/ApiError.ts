export class ApiError extends Error {
  public readonly success: false;
  public readonly statusCode: number;
  public readonly errors: unknown[];

  constructor(
    statusCode: number,
    message = "Something went wrong",
    errors: unknown[] = [],
  ) {
    super(message);

    this.success = false;
    this.statusCode = statusCode;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
