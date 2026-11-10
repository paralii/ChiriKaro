import express, { Router } from "express";
import type { RequestHandler } from "express";
import type { DoctorController } from "@presentation/controllers/doctor.controller.ts";

export interface DoctorRouterMiddlewares {
  authenticate: RequestHandler;
  authorizeDoctor: RequestHandler;
  authorizeClinicAdmin: RequestHandler;
}

export function DoctorRouter(
  controller: DoctorController,
  middlewares: DoctorRouterMiddlewares,
): Router {
  const router = Router();
  const { authenticate, authorizeDoctor, authorizeClinicAdmin } = middlewares;

  router.get("/doctor/onboarding", authenticate, authorizeDoctor, controller.getOnboarding);
  router.patch("/doctor/onboarding/:step", authenticate, authorizeDoctor, controller.updateOnboarding);
  router.post(
    "/doctor/onboarding/documents",
    authenticate,
    authorizeDoctor,
    express.raw({ type: ["application/pdf", "image/jpeg", "image/png"], limit: "10mb" }),
    controller.uploadDocument,
  );
  router.get(
    "/doctor/onboarding/documents/:documentType",
    authenticate,
    authorizeDoctor,
    controller.getDocument,
  );
  router.delete(
    "/doctor/onboarding/documents/:documentType",
    authenticate,
    authorizeDoctor,
    controller.deleteDocument,
  );

  router.get("/doctor/verification", authenticate, authorizeDoctor, controller.getVerification);
  router.post("/doctor/verification/submit", authenticate, authorizeDoctor, controller.submitVerification);
  router.get("/doctor/consultation-fee", authenticate, authorizeDoctor, controller.getConsultationFee);
  router.get("/doctor/availability", authenticate, authorizeDoctor, controller.getAvailability);
  router.put("/doctor/availability", authenticate, authorizeDoctor, controller.configureAvailability);
  router.post("/doctor/availability/slots", authenticate, authorizeDoctor, controller.generateAvailabilitySlots);

  router.get(
    "/clinic/doctors/pending-verification",
    authenticate,
    authorizeClinicAdmin,
    controller.listPendingVerifications,
  );
  router.get(
    "/clinic/doctors/:doctorId/verification",
    authenticate,
    authorizeClinicAdmin,
    controller.getVerificationDetails,
  );
  router.patch(
    "/clinic/doctors/:doctorId/consultation-fee",
    authenticate,
    authorizeClinicAdmin,
    controller.updateConsultationFee,
  );
  router.get(
    "/clinic/doctors/:doctorId/verification/documents/:documentType",
    authenticate,
    authorizeClinicAdmin,
    controller.getClinicDoctorDocument,
  );
  router.post(
    "/clinic/doctors/:doctorId/verification/approve",
    authenticate,
    authorizeClinicAdmin,
    controller.approveVerification,
  );
  router.post(
    "/clinic/doctors/:doctorId/verification/reject",
    authenticate,
    authorizeClinicAdmin,
    controller.rejectVerification,
  );
  return router;
}
