import { Router } from "express";
import type { RequestHandler } from "express";
import type { SuperAdminClinicController } from "@presentation/controllers/super-admin-clinic.controller.ts";

export function createSuperAdminClinicRouter(
  controller: SuperAdminClinicController,
  middleware: { authenticate: RequestHandler; authorizeSuperAdmin: RequestHandler },
): Router {
  const router = Router();
  const { authenticate, authorizeSuperAdmin } = middleware;

  router.get("/super-admin/clinics", authenticate, authorizeSuperAdmin, controller.listClinics);
  router.get("/super-admin/clinics/:id", authenticate, authorizeSuperAdmin, controller.getClinic);
  router.patch(
    "/super-admin/clinics/:id/status",
    authenticate,
    authorizeSuperAdmin,
    controller.updateClinicStatus,
  );

  return router;
}
