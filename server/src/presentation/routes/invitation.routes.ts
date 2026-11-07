import { Router } from "express";
import type { RequestHandler } from "express";
import type { InvitationController } from "@presentation/controllers/invitation.controller.ts";

export function createInvitationRouter(
  controller: InvitationController,
  middleware: { authenticate: RequestHandler; authorizeClinicAdmin: RequestHandler },
): Router {
  const router = Router();
  const { authenticate, authorizeClinicAdmin } = middleware;

  router.post(
    "/clinic/invitations",
    authenticate,
    authorizeClinicAdmin,
    controller.create,
  );
  router.get(
    "/clinic/invitations/pending",
    authenticate,
    authorizeClinicAdmin,
    controller.listPending,
  );
  router.post(
    "/clinic/invitations/:id/resend",
    authenticate,
    authorizeClinicAdmin,
    controller.resend,
  );

  return router;
}
