import type { Request, Response, NextFunction } from "express";
import { logger } from "../../infrastructure/logger/logger.js";
import { AppError } from "../../shared/errors/index.js";
import { InvalidClinicDataError, InvalidDoctorDataError, InvalidInvitationDataError, InvalidUserDataError } from "../../domain/error/DomainError.js";
import { RetryableAIProviderError, TooManyRequestsError } from "../../shared/errors/index.js";

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
  retryAfterSeconds?: number;
} => {
  if (err instanceof AppError) {
    const result: {
      statusCode: number;
      message: string;
      errors?: Record<string, string[]>;
      retryAfterSeconds?: number;
    } = {
      statusCode: err.statusCode,
      message: err.message,
    };

    if (err.errors) {
      result.errors = err.errors;
    }
    if ((err instanceof TooManyRequestsError || err instanceof RetryableAIProviderError) && err.retryAfterSeconds !== undefined) result.retryAfterSeconds = err.retryAfterSeconds;

    return result;
  }

  if (err instanceof InvalidClinicDataError || err instanceof InvalidDoctorDataError || err instanceof InvalidInvitationDataError || err instanceof InvalidUserDataError) {
    return { statusCode: 422, message: err.message };
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
  _next: NextFunction,
): void => {
  void _next;
  const { statusCode, message, errors, retryAfterSeconds } = resolveErrorDetails(err);

  // AI failures are deliberately logged without exception details, which may contain provider or prompt data.
  const isAIAssistanceRequest = req.originalUrl.includes("/ai/");
  const safeAIFailure = isAIAssistanceRequest || err instanceof TooManyRequestsError || err instanceof RetryableAIProviderError;
  const safePath = isAIAssistanceRequest ? "AI assistance route" : req.originalUrl;
  logger.error(`[${req.requestId}] ${req.method} ${safePath} - ${statusCode} - ${safeAIFailure ? "AI assistance request failed" : err.message}`, safeAIFailure ? undefined : { stack: err.stack });

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    requestId: req.requestId,
    ...(process.env.NODE_ENV === "production" || isAIAssistanceRequest ? {} : { stack: err.stack }),
  });
};
