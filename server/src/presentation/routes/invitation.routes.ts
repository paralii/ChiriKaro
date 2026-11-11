import { Router } from "express";
import type { RequestHandler } from "express";

import type { InvitationController } from "@presentation/controllers/invitation.controller.ts";
import { API_ROUTES } from "@shared/constants/apiRoutes.ts";

export interface ClinicRouterMiddlewares {
  authenticate: RequestHandler;
  authorizeClinicAdmin: RequestHandler;
}

export function createInvitationRouter(
  invitationController: InvitationController,
  middlewares: ClinicRouterMiddlewares,
): Router {
  const router = Router();
  const { authenticate, authorizeClinicAdmin } = middlewares;

  router.post(API_ROUTES.INVITATION.VALIDATE, invitationController.validate);
  router.post(API_ROUTES.INVITATION.ACCEPT, invitationController.accept);
  router.post(
    API_ROUTES.CLINIC.INVITATIONS,
    authenticate,
    authorizeClinicAdmin,
    invitationController.create,
  );
  router.get(
    API_ROUTES.CLINIC.PENDING_INVITATIONS,
    authenticate,
    authorizeClinicAdmin,
    invitationController.listPending,
  );
  router.post(
    API_ROUTES.CLINIC.RESEND_INVITATION,
    authenticate,
    authorizeClinicAdmin,
    invitationController.resend,
  );

  return router;
}
