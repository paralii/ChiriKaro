import express from "express";
import type { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authRouter } from "@container/auth.container.ts";
import { superAdminRouter } from "@container/super-admin.container.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";

export class App {
  public readonly instance: Application;

  constructor() {
    this.instance = express();

    this.initializeGlobalMiddlewares();
    this.initializeHealthCheck();
    this.initializeRoutes();
    this.registerErrorHandlers();
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
      res
        .status(200)
        .json(
          ApiResponse.success("Server is running and health is good", {
            timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          }),
        );
    });
  }

  private initializeRoutes(): void {
    this.instance.use("/api", authRouter);
    this.instance.use("/api", superAdminRouter);
  }

  public registerErrorHandlers(): void {
    this.instance.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json(ApiResponse.failed("Internal server error"));
      },
    );

    this.instance.use((_req, res) => {
      res
        .status(HttpStatus.NOT_FOUND)
        .json(ApiResponse.failed("Route not found"));
    });
  }
}

export const app = new App();
