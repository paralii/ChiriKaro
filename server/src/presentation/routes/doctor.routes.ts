import { Router } from "express";
import type { RequestHandler } from "express";

import type { DoctorController } from "../controllers/doctor.controller.js";

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

  const { authenticate, authorizeDoctor, authorizeClinicAdmin } = middlewares;

  //Doctor profile
  router.get(
    "/doctor/profile",
    authenticate,
    authorizeDoctor,
    doctorController.getDoctorProfile,
  );
  router.patch(
    "/doctor/profile",
    authenticate,
    authorizeDoctor,
    doctorController.updateDoctorProfile,
  );

  //Doctor verification
  router.get(
    "/doctor/verification",
    authenticate,
    authorizeDoctor,
    doctorController.getDoctorVerification,
  );
  router.post(
    "/doctor/submit-verification",
    authenticate,
    authorizeDoctor,
    doctorController.submitDoctorVerification,
  );

  //Clinic administration: doctors
  router.get(
    "/clinic/doctors",
    authenticate,
    authorizeClinicAdmin,
    doctorController.getClinicDoctors,
  );
  // router.get(
  //   "/clinic/doctors/:id",
  //   authenticate,
  //   authorizeClinicAdmin,
  //   doctorController.getDoctorById,
  // );
  router.post(
    "/clinic/doctors/:id/approve",
    authenticate,
    authorizeClinicAdmin,
    doctorController.approveDoctor,
  );
  router.post(
    "/clinic/doctors/:id/reject",
    authenticate,
    authorizeClinicAdmin,
    doctorController.rejectDoctor,
  );
  router.get(
    "/clinic/doctors/:id/documents/:documentType/download-url",
    authenticate,
    authorizeClinicAdmin,
    doctorController.getClinicDoctorDocumentDownloadUrl,
  );
  router.patch(
    "/clinic/doctors/:id/fee",
    authenticate,
    authorizeClinicAdmin,
    doctorController.updateDoctorConsultationFee,
  );

  //Doctor documents
  router.post(
    "/doctor/documents/upload-url",
    authenticate,
    authorizeDoctor,
    doctorController.generateDoctorDocumentUploadUrl,
  );
  router.get(
    "/doctor/documents/:documentType/download-url",
    authenticate,
    authorizeDoctor,
    doctorController.getDoctorDocumentUrl,
  );
  router.get(
    "/doctor/documents",
    authenticate,
    authorizeDoctor,
    doctorController.getDoctorDocuments,
  );
  router.post(
    "/doctor/documents",
    authenticate,
    authorizeDoctor,
    doctorController.saveDoctorDocument,
  );

  //Doctor availability
  router.get(
    "/doctor/availability",
    authenticate,
    authorizeDoctor,
    doctorController.getDoctorAvailability,
  );
  router.put(
    "/doctor/availability",
    authenticate,
    authorizeDoctor,
    doctorController.updateDoctorAvailability,
  );

  //Doctor slot configuration
  router.get(
    "/doctor/slot-config",
    authenticate,
    authorizeDoctor,
    doctorController.getDoctorSlotConfig,
  );
  router.put(
    "/doctor/slot-config",
    authenticate,
    authorizeDoctor,
    doctorController.updateDoctorSlotConfig,
  );

  //Appointment slot generation
  router.post(
    "/doctor/generate-slots",
    authenticate,
    authorizeDoctor,
    doctorController.generateDoctorSlots,
  );

  return router;
}
