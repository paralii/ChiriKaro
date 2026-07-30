import type { Request, Response, NextFunction } from "express";
import { logger } from "@infrastructure/logger/logger.js";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const requestId = req.headers["x-request-id"];

    logger.http(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`,
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
      },
    );
  });

  next();
};
