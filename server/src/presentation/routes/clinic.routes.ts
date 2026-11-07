import { Router } from "express";
import express from "express";
import type { RequestHandler } from "express";

import type { ClinicController } from "@presentation/controllers/clinic.controller.ts";

export interface ClinicRouterMiddlewares {
  authenticate: RequestHandler;
  authorizeClinicAdmin: RequestHandler;
}

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
  const { authenticate, authorizeClinicAdmin } = middlewares;

  //Clinic registration
  router.post("/clinic/register", clinicController.register);

  // Clinic profile and dashboard
  router.get(
    "/clinic/profile",
    authenticate,
    authorizeClinicAdmin,
    clinicController.getProfile,
  );

  router.patch(
    "/clinic/setup",
    authenticate,
    authorizeClinicAdmin,
    clinicController.updateSetup,
  );
  router.post(
    "/clinic/setup/documents",
    authenticate,
    authorizeClinicAdmin,
    express.raw({ type: ["application/pdf", "image/jpeg", "image/png"], limit: "10mb" }),
    clinicController.uploadDocument,
  );
  router.get(
    "/clinic/setup/documents/:documentType",
    authenticate,
    authorizeClinicAdmin,
    clinicController.getDocument,
  );
  router.post(
    "/clinic/setup/submit",
    authenticate,
    authorizeClinicAdmin,
    clinicController.submitSetup,
  );

  router.patch(
    "/clinic/profile",
    authenticate,
    authorizeClinicAdmin,
    clinicController.updateProfile,
  );

  router.get(
    "/clinic/dashboard",
    authenticate,
    authorizeClinicAdmin,
    clinicController.getDashboard,
  );

  // //Clinic settings
  // router.put(
  //   "/clinic/specializations",
  //   authenticate,
  //   authorizeClinicAdmin,
  //   clinicController.updateSpecializations,
  // );
  // router.put(
  //   "/clinic/working-hours",
  //   authenticate,
  //   authorizeClinicAdmin,
  //   clinicController.updateWorkingHours,
  // );

  // //Clinic documents
  // router.post(
  //   "/clinic/documents/upload-url",
  //   authenticate,
  //   authorizeClinicAdmin,
  //   clinicController.createDocumentUploadUrl,
  // );
  // router.get(
  //   "/clinic/documents",
  //   authenticate,
  //   authorizeClinicAdmin,
  //   clinicController.getDocuments,
  // );
  // router.post(
  //   "/clinic/documents",
  //   authenticate,
  //   authorizeClinicAdmin,
  //   clinicController.saveDocument,
  // );
  // router.get(
  //   "/clinic/documents/:documentType/download-url",
  //   authenticate,
  //   authorizeClinicAdmin,
  //   clinicController.getDocumentDownloadUrl,
  // );

  // //Super admin: clinic management
  // router.get(
  //   "/super-admin/clinics",
  //   authenticate,
  //   authorizeSuperAdmin,
  //   clinicController.listClinics,
  // );
  // router.get(
  //   "/super-admin/clinics/dashboard",
  //   authenticate,
  //   authorizeSuperAdmin,
  //   clinicController.getClinicsDashboard,
  // );
  // router.patch(
  //   "/super-admin/clinics/:id/status",
  //   authenticate,
  //   authorizeSuperAdmin,
  //   clinicController.updateClinicStatus,
  // );

  return router;
}
