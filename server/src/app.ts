import express from "express";
import type { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authRouter } from "@container/auth.container.ts";
import { clinicRouter } from "@container/clinic.container.ts";
import { superAdminClinicRouter } from "@container/super-admin-clinic.container.ts";
import { invitationRouter } from "@container/invitation.container.ts";
import { roleDashboardRouter } from "@container/role-dashboard.container.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { errorMiddleware } from "@presentation/middleware/error.middleware.ts";

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
      res.status(200).json(
        ApiResponse.success("Server is running and health is good", {
          timestamp: new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          }),
        }),
      );
    });
  }

  private initializeRoutes(): void {
    this.instance.use("/api", authRouter);
    this.instance.use("/api", clinicRouter);
    this.instance.use("/api", superAdminClinicRouter);
    this.instance.use("/api", invitationRouter);
    this.instance.use("/api", roleDashboardRouter);
  }

  public registerErrorHandlers(): void {
    this.instance.use(errorMiddleware);

    this.instance.use((_req, res) => {
      res
        .status(HttpStatus.NOT_FOUND)
        .json(ApiResponse.failed("Route not found"));
    });
  }
}

export const app = new App();
