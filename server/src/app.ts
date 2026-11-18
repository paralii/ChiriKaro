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
import { publicDirectoryRouter } from "@container/public-directory.container.ts";
import { patientAppointmentsRouter } from "@container/patient-appointments.container.ts";
import { patientAppointmentPaymentsRouter } from "@container/patient-appointment-payments.container.ts";
import { clinicQueueRouter } from "@container/clinic-queue.container.ts";
import { patientQueueRouter } from "@container/patient-queue.container.ts";
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

    this.instance.use(express.json({
      limit: "10mb",
      verify: (req, _res, buffer) => {
        if ((req.url ?? "").includes("/payments/razorpay/webhook")) {
          (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
        }
      },
    }));

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
    this.instance.use(API_ROUTES.SEARCH.BASE, publicDirectoryRouter);
    this.instance.use(API_ROUTES.PATIENT.BASE, patientAppointmentsRouter);
    this.instance.use(API_ROUTES.PATIENT.BASE, patientAppointmentPaymentsRouter);
    this.instance.use(API_ROUTES.PATIENT.BASE, patientQueueRouter);
    this.instance.use(API_ROUTES.SUPER_ADMIN.BASE, superAdminRouter);
    this.instance.use(API_ROUTES.CLINIC.BASE, clinicRouter);
    this.instance.use(API_ROUTES.CLINIC.BASE, clinicQueueRouter);
    this.instance.use(API_ROUTES.DOCTOR.BASE, doctorRouter);
    // The router also serves authenticated clinic invitation endpoints.
    this.instance.use(API_ROUTES.CLINIC.BASE, invitationRouter);
    // Public token validation and acceptance use /api/invitation/*.
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
