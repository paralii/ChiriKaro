import { Router } from "express";
import type { RequestHandler } from "express";
import type { AnalyticsController } from "@presentation/controllers/analytics.controller.ts";
import { Role } from "@domain/value-objects/Role.ts";

export function AnalyticsRouter(controller: AnalyticsController, middleware: { authenticate: RequestHandler; authorize: (...roles: Role[]) => RequestHandler }): Router {
  const router = Router();
  router.get("/super-admin/analytics", middleware.authenticate, middleware.authorize(Role.SUPER_ADMIN), controller.get);
  router.get("/clinic/analytics", middleware.authenticate, middleware.authorize(Role.CLINIC_ADMIN), controller.get);
  router.get("/doctor/analytics", middleware.authenticate, middleware.authorize(Role.DOCTOR), controller.get);
  return router;
}
