import { Router } from "express";
import type { RequestHandler } from "express";
import type { SuperAdminController } from "@presentation/controllers/super-admin.controller.ts";

export function createSuperAdminRouter(
  controller: SuperAdminController,
  middleware: { authenticate: RequestHandler; authorizeSuperAdmin: RequestHandler },
): Router {
  const router = Router();
  const { authenticate, authorizeSuperAdmin } = middleware;
  router.get("/super-admin/clinics/:id/documents/:documentType", authenticate, authorizeSuperAdmin, controller.getClinicDocument);
  router.get("/super-admin/clinics", authenticate, authorizeSuperAdmin, controller.listClinics);
  router.get("/super-admin/clinics/:id", authenticate, authorizeSuperAdmin, controller.getClinic);
  router.patch("/super-admin/clinics/:id/status", authenticate, authorizeSuperAdmin, controller.updateClinicStatus);
  router.get("/super-admin/statistics", authenticate, authorizeSuperAdmin, controller.getStatistics);
  return router;
}
