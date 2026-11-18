import { Router } from "express";
import type { RequestHandler } from "express";
import type { PatientQueueController } from "@presentation/controllers/patient-queue.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

export function PatientQueueRouter(controller: PatientQueueController, middleware: { authenticate: RequestHandler; authorizePatient: RequestHandler }): Router {
  const router = Router();
  router.get(API_ROUTES.PATIENT.QUEUE, middleware.authenticate, middleware.authorizePatient, controller.list);
  return router;
}
