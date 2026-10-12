import type { Request, Response, NextFunction } from "express";
import { appConfig } from "../../infrastructure/config/app.config.js";
import { logger } from "../../infrastructure/logger/logger.js";
import { AppError } from "../../shared/errors/index.js";

interface MongoServerErrorLike extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface MongooseValidationErrorLike extends Error {
  name: "ValidationError";
  errors: Record<string, { message: string }>;
}

interface MongooseCastErrorLike extends Error {
  name: "CastError";
  path: string;
  value: unknown;
}

const isMongoServerError = (err: Error): err is MongoServerErrorLike =>
  err.name === "MongoServerError" &&
  (err as MongoServerErrorLike).code === 11000;

const isMongooseValidationError = (
  err: Error,
): err is MongooseValidationErrorLike =>
  err.name === "ValidationError" && !(err instanceof AppError);

const isMongooseCastError = (err: Error): err is MongooseCastErrorLike =>
  err.name === "CastError";

const isJwtError = (err: Error): boolean =>
  err.name === "JsonWebTokenError" || err.name === "TokenExpiredError";

const resolveErrorDetails = (
  err: Error,
): {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
} => {
  if (err instanceof AppError) {
    const result: { statusCode: number; message: string; errors?: Record<string, string[]> } = {
      statusCode: err.statusCode,
      message: err.message,
    };

    if (err.errors) {
      result.errors = err.errors;
    }

    return result;
  }

  if (isMongoServerError(err)) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
    return {
      statusCode: 409,
      message: `Duplicate value for field: ${field}`,
    };
  }

  if (isMongooseValidationError(err)) {
    const errors: Record<string, string[]> = {};
    Object.entries(err.errors).forEach(([key, value]) => {
      errors[key] = [value.message];
    });
    return {
      statusCode: 422,
      message: "Validation failed",
      errors,
    };
  }

  if (isMongooseCastError(err)) {
    return {
      statusCode: 400,
      message: `Invalid value for field: ${err.path}`,
    };
  }

  if (isJwtError(err)) {
    return {
      statusCode: 401,
      message:
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
    };
  }

  return {
    statusCode: 500,
    message: "Internal server error",
  };
};

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { statusCode, message, errors } = resolveErrorDetails(err);

  logger.error(
    `[${req.requestId}] ${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`,
    { stack: err.stack },
  );

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    requestId: req.requestId,
    ...(appConfig.isProduction ? {} : { stack: err.stack }),
  });
};
