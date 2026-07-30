export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public readonly isOperational: boolean = true;
  public readonly errors?: Record<string, string[] > | undefined;

  constructor(message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = this.constructor.name;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
