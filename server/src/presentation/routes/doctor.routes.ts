import express, { Router } from "express";
import type { RequestHandler } from "express";
import type { DoctorController } from "@presentation/controllers/doctor.controller.ts";

export interface DoctorRouterMiddlewares {
  authenticate: RequestHandler;
  authorizeDoctor: RequestHandler;
}

export function DoctorRouter(
  controller: DoctorController,
  middlewares: DoctorRouterMiddlewares,
): Router {
  const router = Router();
  const { authenticate, authorizeDoctor } = middlewares;

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
  return router;
}
