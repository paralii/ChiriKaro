import { Router } from "express";
import type { RequestHandler } from "express";
import type { RoleDashboardController } from "@presentation/controllers/role-dashboard.controller.ts";
import type { PatientProfileController } from "@presentation/controllers/patient-profile.controller.ts";

export interface RoleDashboardRouterMiddleware {
  authenticate: RequestHandler;
  authorizePatient: RequestHandler;
  authorizeDoctor: RequestHandler;
  authorizeStaff: RequestHandler;
}

export function createRoleDashboardRouter(
  dashboardController: RoleDashboardController,
  patientProfileController: PatientProfileController,
  middleware: RoleDashboardRouterMiddleware,
): Router {
  const router = Router();
  const { authenticate, authorizePatient, authorizeDoctor, authorizeStaff } = middleware;

  router.get(
    "/patient/dashboard",
    authenticate,
    authorizePatient,
    dashboardController.getDashboard,
  );
  router.patch(
    "/patient/profile",
    authenticate,
    authorizePatient,
    patientProfileController.update,
  );
  router.get(
    "/doctor/dashboard",
    authenticate,
    authorizeDoctor,
    dashboardController.getDashboard,
  );
  router.get(
    "/staff/dashboard",
    authenticate,
    authorizeStaff,
    dashboardController.getDashboard,
  );

  return router;
}
