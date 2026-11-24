import { Router } from "express";
import type { RequestHandler } from "express";
import type { BillingController } from "@presentation/controllers/billing.controller.ts";
import { Role } from "@domain/value-objects/Role.ts";
export function BillingRouter(controller: BillingController, middleware: { authenticate: RequestHandler; authorize: (...roles: Role[]) => RequestHandler }): Router {
  const router = Router();
  router.get("/super-admin/billing/transactions", middleware.authenticate, middleware.authorize(Role.SUPER_ADMIN), controller.transactions);
  router.get("/clinic/billing/transactions", middleware.authenticate, middleware.authorize(Role.CLINIC_ADMIN), controller.transactions);
  router.get("/doctor/billing/transactions", middleware.authenticate, middleware.authorize(Role.DOCTOR), controller.transactions);
  router.get("/super-admin/billing/summary", middleware.authenticate, middleware.authorize(Role.SUPER_ADMIN), controller.summary);
  router.get("/clinic/billing/summary", middleware.authenticate, middleware.authorize(Role.CLINIC_ADMIN), controller.summary);
  router.get("/super-admin/settlements", middleware.authenticate, middleware.authorize(Role.SUPER_ADMIN), controller.settlements);
  router.post("/super-admin/settlements", middleware.authenticate, middleware.authorize(Role.SUPER_ADMIN), controller.createSettlement);
  router.get("/super-admin/settlements/:settlementId", middleware.authenticate, middleware.authorize(Role.SUPER_ADMIN), controller.settlement);
  router.patch("/super-admin/settlements/:settlementId", middleware.authenticate, middleware.authorize(Role.SUPER_ADMIN), controller.updateSettlement);
  router.get("/clinic/settlements", middleware.authenticate, middleware.authorize(Role.CLINIC_ADMIN), controller.settlements);
  router.get("/clinic/settlements/:settlementId", middleware.authenticate, middleware.authorize(Role.CLINIC_ADMIN), controller.settlement);
  return router;
}
