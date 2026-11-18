import { Router } from "express";
import type { RequestHandler } from "express";
import type { PatientAppointmentsController } from "@presentation/controllers/patient-appointments.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

export function PatientAppointmentsRouter(
  controller: PatientAppointmentsController,
  middleware: { authenticate: RequestHandler; authorizePatient: RequestHandler },
): Router {
  const router = Router();
  router.post(API_ROUTES.PATIENT.APPOINTMENTS, middleware.authenticate, middleware.authorizePatient, controller.create);
  router.get(API_ROUTES.PATIENT.APPOINTMENTS, middleware.authenticate, middleware.authorizePatient, controller.list);
  router.get(API_ROUTES.PATIENT.APPOINTMENT_BY_ID, middleware.authenticate, middleware.authorizePatient, controller.get);
  router.post(API_ROUTES.PATIENT.APPOINTMENT_CANCEL, middleware.authenticate, middleware.authorizePatient, controller.cancel);
  router.post(API_ROUTES.PATIENT.APPOINTMENT_RESCHEDULE, middleware.authenticate, middleware.authorizePatient, controller.reschedule);
  return router;
}
