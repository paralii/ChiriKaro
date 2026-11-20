import { Router } from "express";
import type { RequestHandler } from "express";
import type { PatientAppointmentPaymentsController } from "@presentation/controllers/patient-appointment-payments.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

export function PatientAppointmentPaymentsRouter(
  controller: PatientAppointmentPaymentsController,
  middleware: { authenticate: RequestHandler; authorizePatient: RequestHandler },
): Router {
  const router = Router();
  router.post(API_ROUTES.PATIENT.APPOINTMENT_PAYMENT_ORDER, middleware.authenticate, middleware.authorizePatient, controller.createOrder);
  router.post(API_ROUTES.PATIENT.APPOINTMENT_PAYMENT_VERIFY, middleware.authenticate, middleware.authorizePatient, controller.verify);
  router.post(API_ROUTES.PATIENT.APPOINTMENT_PAYMENT_TEST_CONFIRM, middleware.authenticate, middleware.authorizePatient, controller.confirmTestPayment);
  router.get(API_ROUTES.PATIENT.APPOINTMENT_PAYMENT_STATUS, middleware.authenticate, middleware.authorizePatient, controller.status);
  router.post(API_ROUTES.PATIENT.PAYMENT_WEBHOOK, controller.webhook);
  return router;
}
