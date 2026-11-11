import { Router } from "express";
import type { RequestHandler } from "express";
import type { SuperAdminController } from "@presentation/controllers/super-admin.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

export function createSuperAdminRouter(
  superAdminController: SuperAdminController,
  middleware: {
    authenticate: RequestHandler;
    authorizeSuperAdmin: RequestHandler;
  },
): Router {
  const router = Router();
  const { authenticate, authorizeSuperAdmin } = middleware;
  router.get(
    API_ROUTES.SUPER_ADMIN.CLINIC_DOCUMENT_BY_TYPE,
    authenticate,
    authorizeSuperAdmin,
    superAdminController.getClinicDocument,
  );
  router.get(
    API_ROUTES.SUPER_ADMIN.CLINICS,
    authenticate,
    authorizeSuperAdmin,
    superAdminController.listClinics,
  );
  router.get(
    API_ROUTES.SUPER_ADMIN.CLINIC_DETAILS,
    authenticate,
    authorizeSuperAdmin,
    superAdminController.getClinic,
  );
  router.patch(
    API_ROUTES.SUPER_ADMIN.CLINIC_STATUS,
    authenticate,
    authorizeSuperAdmin,
    superAdminController.updateClinicStatus,
  );
  router.get(
    API_ROUTES.SUPER_ADMIN.STATISTICS,
    authenticate,
    authorizeSuperAdmin,
    superAdminController.getStatistics,
  );
  return router;
}
