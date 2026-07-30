import express from "express";
import type { Application, Router } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { appConfig } from "./infrastructure/config/index.js";
import {
  requestIdMiddleware,
  notFoundMiddleware,
  errorMiddleware,
  sanitizeInput,
} from "./presentation/middleware/index.js";
import { globalApiRateLimiter } from "./shared/utils/rateLimiters.js";
import { requestLogger } from "./infrastructure/logger/requestLogger.js";

export class App {
  public readonly instance: Application;

  constructor() {
    this.instance = express();
    this.initializeGlobalMiddlewares();
    this.initializeHealthCheck();
  }

  private initializeGlobalMiddlewares(): void {
    this.instance.use(requestIdMiddleware);
    this.instance.use(requestLogger);

    this.instance.use(
      cors({
        origin: appConfig.clientUrl,
        credentials: true,
      }),
    );

    this.instance.use(express.json({ limit: "10mb" }));
    this.instance.use(express.urlencoded({ extended: true, limit: "10mb" }));
    this.instance.use(cookieParser());
    this.instance.use(sanitizeInput);
    this.instance.use(globalApiRateLimiter);
  }

  private initializeHealthCheck(): void {
    this.instance.get("/health", (_req, res) => {
      res.status(200).json({
        success: true,
        message: `${appConfig.nodeName} is running`,
        environment: appConfig.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    });
  }

  public registerRoutes(router: Router): void {
    this.instance.use(appConfig.apiPrefix, router);
  }

  public registerErrorHandlers(): void {
    this.instance.use(notFoundMiddleware);
    this.instance.use(errorMiddleware);
  }
}

export const app = new App();
