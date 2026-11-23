import { Router } from "express";
import type { PublicDirectoryController } from "@presentation/controllers/public-directory.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

export function PublicDirectoryRouter(controller: PublicDirectoryController): Router {
  const router = Router();
  router.get(API_ROUTES.SEARCH.DIRECTORY, controller.search);
  router.get(API_ROUTES.SEARCH.DIRECTORY_CLINIC_PROFILE, controller.clinicProfile);
  router.get(API_ROUTES.SEARCH.DIRECTORY_DOCTOR_PROFILE, controller.doctorProfile);
  router.get(API_ROUTES.SEARCH.DIRECTORY_AVAILABILITY, controller.availability);
  return router;
}
