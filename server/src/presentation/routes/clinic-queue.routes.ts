import { Router } from "express";
import type { RequestHandler } from "express";
import type { ClinicQueueController } from "@presentation/controllers/clinic-queue.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

export function ClinicQueueRouter(
  controller: ClinicQueueController,
  middleware: { authenticate: RequestHandler; authorizeWalkIn: RequestHandler; authorizeQueueRead: RequestHandler },
): Router {
  const router = Router();
  router.get(API_ROUTES.CLINIC.QUEUE, middleware.authenticate, middleware.authorizeQueueRead, controller.getQueue);
  router.get(API_ROUTES.CLINIC.QUEUE_DOCTORS, middleware.authenticate, middleware.authorizeQueueRead, controller.getDoctors);
  router.post(API_ROUTES.CLINIC.QUEUE_WALK_INS, middleware.authenticate, middleware.authorizeWalkIn, controller.createWalkIn);
  router.post(API_ROUTES.CLINIC.QUEUE_APPOINTMENT_CHECK_IN, middleware.authenticate, middleware.authorizeWalkIn, controller.checkInAppointment);
  return router;
}
