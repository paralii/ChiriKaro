import express from "express";
import type { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "@container/auth.container.ts";
import { superAdminRouter } from "@container/super-admin.container.ts";
import { clinicRouter } from "@container/clinic.container.ts";
import { doctorRouter } from "@container/doctor.container.ts";
import { invitationRouter } from "@container/invitation.container.ts";
import { roleDashboardRouter } from "@container/role-dashboard.container.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";
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
      ApiResponse.success(res, "Server is running and health is good", {
        timestamp: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      })
    });
  }

  private initializeRoutes(): void {
    this.instance.use(API_ROUTES.AUTH.BASE, authRouter);
    this.instance.use(API_ROUTES.SUPER_ADMIN.BASE, superAdminRouter);
    this.instance.use(API_ROUTES.CLINIC.BASE, clinicRouter);
    this.instance.use(API_ROUTES.DOCTOR.BASE, doctorRouter);
    this.instance.use(API_ROUTES.INVITATION.BASE, invitationRouter);
    this.instance.use("/api", roleDashboardRouter);
  }

  public registerErrorHandlers(): void {
    this.instance.use(errorMiddleware);

    this.instance.use((_req, res) => {
      ApiResponse.failed(res, "Route not found")
    });
  }
}

export const app = new App();
