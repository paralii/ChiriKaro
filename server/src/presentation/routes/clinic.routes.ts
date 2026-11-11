import { Router } from "express";
import express from "express";
import type { RequestHandler } from "express";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

import type { ClinicController } from "@presentation/controllers/clinic.controller.ts";

export interface ClinicRouterMiddlewares {
  authenticate: RequestHandler;
  authorizeClinicAdmin: RequestHandler;
}

export function ClinicRouter(
  clinicController: ClinicController,
  middlewares: ClinicRouterMiddlewares,
): Router {
  const router = Router();
  const { authenticate, authorizeClinicAdmin } = middlewares;

  router.post(API_ROUTES.CLINIC.REGISTER, clinicController.register);

  router.get(
    API_ROUTES.CLINIC.PROFILE,
    authenticate,
    authorizeClinicAdmin,
    clinicController.getProfile,
  );

  router.patch(
    API_ROUTES.CLINIC.SETUP,
    authenticate,
    authorizeClinicAdmin,
    clinicController.updateSetup,
  );
  router.post(
    API_ROUTES.CLINIC.SETUP_DOCUMENTS,
    authenticate,
    authorizeClinicAdmin,
    express.raw({
      type: ["application/pdf", "image/jpeg", "image/png"],
      limit: "10mb",
    }),
    clinicController.uploadDocument,
  );
  router.get(
    API_ROUTES.CLINIC.SETUP_DOCUMENT_BY_TYPE,
    authenticate,
    authorizeClinicAdmin,
    clinicController.getDocument,
  );
  router.post(
    API_ROUTES.CLINIC.SETUP_SUBMIT,
    authenticate,
    authorizeClinicAdmin,
    clinicController.submitSetup,
  );

  router.patch(
    API_ROUTES.CLINIC.PROFILE,
    authenticate,
    authorizeClinicAdmin,
    clinicController.updateProfile,
  );

  router.get(
    API_ROUTES.CLINIC.DASHBOARD,
    authenticate,
    authorizeClinicAdmin,
    clinicController.getDashboard,
  );

  router.get(
    API_ROUTES.CLINIC.PENDING_VERIFICATIONS,
    authenticate,
    authorizeClinicAdmin,
    clinicController.listPendingVerifications,
  );
  router.get(
    API_ROUTES.CLINIC.DOCTOR_VERIFICATION,
    authenticate,
    authorizeClinicAdmin,
    clinicController.getVerificationDetails,
  );
  router.patch(
    API_ROUTES.CLINIC.DOCTOR_CONSULTATION_FEE,
    authenticate,
    authorizeClinicAdmin,
    clinicController.updateConsultationFee,
  );
  router.get(
    API_ROUTES.CLINIC.DOCTOR_VERIFICATION_DOCUMENT,
    authenticate,
    authorizeClinicAdmin,
    clinicController.getClinicDoctorDocument,
  );
  router.post(
    API_ROUTES.CLINIC.DOCTOR_VERIFICATION_APPROVE,
    authenticate,
    authorizeClinicAdmin,
    clinicController.approveVerification,
  );
  router.post(
    API_ROUTES.CLINIC.DOCTOR_VERIFICATION_REJECT,
    authenticate,
    authorizeClinicAdmin,
    clinicController.rejectVerification,
  );

  return router;
}
