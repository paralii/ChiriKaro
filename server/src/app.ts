import express from "express";
import type { Application, Router } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

export class App {
  public readonly instance: Application;

  constructor() {
    this.instance = express();
    this.initializeGlobalMiddlewares();
    this.initializeHealthCheck();
  }

  private initializeGlobalMiddlewares(): void {
    this.instance.use(
      cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
      }),
    );

    this.instance.use(express.json({ limit: "10mb" }));

    this.instance.use(
      express.urlencoded({
        extended: true,
        limit: "10mb",
      }),
    );

    this.instance.use(cookieParser());
  }

  private initializeHealthCheck(): void {
    this.instance.get("/health", (_req, res) => {
      res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
      });
    });
  }

  public registerRoutes(router: Router): void {
    this.instance.use("/api", router);
  }

  public registerErrorHandlers(): void {
    this.instance.use((_req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      });
    });

    this.instance.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      },
    );
  }
}

export const app = new App();
