import { Router } from "express";
import type { RequestHandler } from "express";

import type { ClinicController } from "../controllers/clinic.controller.js";

export interface ClinicRouterMiddlewares {
  authenticate: RequestHandler;
  authorizeClinicAdmin: RequestHandler;
  authorizeSuperAdmin: RequestHandler;
}

export function ClinicRouter(
  clinicController: ClinicController,
  middlewares: ClinicRouterMiddlewares,
): Router {
  const router = Router();

  const { authenticate, authorizeClinicAdmin, authorizeSuperAdmin } = middlewares;

  //Clinic registration
  router.post("/clinics/register", clinicController.register);

  //Clinic profile
  router.get(
    "/clinic/profile",
    authenticate,
    authorizeClinicAdmin,
    clinicController.getProfile,
  );
  router.patch(
    "/clinic/profile",
    authenticate,
    authorizeClinicAdmin,
    clinicController.updateProfile,
  );

  //Clinic dashboard
  router.get(
    "/clinic/dashboard",
    authenticate,
    authorizeClinicAdmin,
    clinicController.getDashboard,
  );

  //Clinic settings
  router.put(
    "/clinic/specializations",
    authenticate,
    authorizeClinicAdmin,
    clinicController.updateSpecializations,
  );
  router.put(
    "/clinic/working-hours",
    authenticate,
    authorizeClinicAdmin,
    clinicController.updateWorkingHours,
  );

  //Clinic documents
  router.post(
    "/clinic/documents/upload-url",
    authenticate,
    authorizeClinicAdmin,
    clinicController.createDocumentUploadUrl,
  );
  router.get(
    "/clinic/documents",
    authenticate,
    authorizeClinicAdmin,
    clinicController.getDocuments,
  );
  router.post(
    "/clinic/documents",
    authenticate,
    authorizeClinicAdmin,
    clinicController.saveDocument,
  );
  router.get(
    "/clinic/documents/:documentType/download-url",
    authenticate,
    authorizeClinicAdmin,
    clinicController.getDocumentDownloadUrl,
  );

  //Super admin: clinic management
  router.get(
    "/super-admin/clinics",
    authenticate,
    authorizeSuperAdmin,
    clinicController.listClinics,
  );
  router.get(
    "/super-admin/clinics/dashboard",
    authenticate,
    authorizeSuperAdmin,
    clinicController.getClinicsDashboard,
  );
  router.patch(
    "/super-admin/clinics/:id/status",
    authenticate,
    authorizeSuperAdmin,
    clinicController.updateClinicStatus,
  );

  return router;
}