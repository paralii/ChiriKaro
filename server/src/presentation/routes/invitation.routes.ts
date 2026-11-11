import { Router } from "express";
import type { InvitationController } from "@presentation/controllers/invitation.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

export function createInvitationRouter(
  invitationController: InvitationController,
): Router {
  const router = Router();

  router.post(API_ROUTES.INVITATION.VALIDATE, invitationController.validate);
  router.post(API_ROUTES.INVITATION.ACCEPT, invitationController.accept);
  return router;
}
