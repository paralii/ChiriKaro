import express, { Router } from "express";
import type { RequestHandler } from "express";
import type { DoctorController } from "@presentation/controllers/doctor.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

export interface DoctorRouterMiddlewares {
  authenticate: RequestHandler;
  authorizeDoctor: RequestHandler;
  authorizeClinicAdmin: RequestHandler;
}

export function DoctorRouter(
  doctorController: DoctorController,
  middlewares: DoctorRouterMiddlewares,
): Router {
  const router = Router();
  const { authenticate, authorizeDoctor } = middlewares;

  router.get(
    API_ROUTES.DOCTOR.ONBOARDING,
    authenticate,
    authorizeDoctor,
    doctorController.getOnboarding,
  );
  router.patch(
    API_ROUTES.DOCTOR.ONBOARDING_STEP,
    authenticate,
    authorizeDoctor,
    doctorController.updateOnboarding,
  );
  router.post(
    API_ROUTES.DOCTOR.ONBOARDING_DOCUMENTS,
    authenticate,
    authorizeDoctor,
    express.raw({
      type: ["application/pdf", "image/jpeg", "image/png"],
      limit: "10mb",
    }),
    doctorController.uploadDocument,
  );
  router.get(
    API_ROUTES.DOCTOR.ONBOARDING_DOCUMENT_BY_TYPE,
    authenticate,
    authorizeDoctor,
    doctorController.getDocument,
  );
  router.delete(
    API_ROUTES.DOCTOR.ONBOARDING_DOCUMENT_BY_TYPE,
    authenticate,
    authorizeDoctor,
    doctorController.deleteDocument,
  );

  router.get(
    API_ROUTES.DOCTOR.VERIFICATION,
    authenticate,
    authorizeDoctor,
    doctorController.getVerification,
  );
  router.post(
    API_ROUTES.DOCTOR.VERIFICATION_SUBMIT,
    authenticate,
    authorizeDoctor,
    doctorController.submitVerification,
  );
  router.get(
    API_ROUTES.DOCTOR.CONSULTATION_FEE,
    authenticate,
    authorizeDoctor,
    doctorController.getConsultationFee,
  );
  router.get(
    API_ROUTES.DOCTOR.AVAILABILITY,
    authenticate,
    authorizeDoctor,
    doctorController.getAvailability,
  );
  router.put(
    API_ROUTES.DOCTOR.AVAILABILITY,
    authenticate,
    authorizeDoctor,
    doctorController.configureAvailability,
  );
  router.post(
    API_ROUTES.DOCTOR.AVAILABILITY_SLOTS,
    authenticate,
    authorizeDoctor,
    doctorController.generateAvailabilitySlots,
  );
  return router;
}
