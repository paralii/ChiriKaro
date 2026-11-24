import type { NextFunction, Request, Response } from "express";
import { Role } from "@domain/value-objects/Role.ts";
import { SettlementStatus } from "@domain/enum/settlement-status.enum.ts";
import type { BillingScope, BillingFilters, SettlementFilters } from "@application/dto/billing/billing.dto.ts";
import type { IBillingUseCase } from "@application/interfaces/use-cases/IBillingUseCase.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { BadRequestError, ForbiddenError } from "@shared/errors/index.ts";
const stringQuery = (value: unknown): string | null => typeof value === "string" && value.trim() ? value.trim() : null;
const dateQuery = (value: unknown, endOfDay = false): Date | null => { const raw = stringQuery(value); if (!raw) return null; const date = new Date(raw); if (Number.isNaN(date.getTime())) throw new BadRequestError("Date filter is invalid"); if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(raw)) date.setUTCHours(23, 59, 59, 999); return date; };
const pageQuery = (value: unknown, fallback: number): number => { const raw = stringQuery(value); if (!raw) return fallback; const parsed = Number(raw); if (!Number.isInteger(parsed)) throw new BadRequestError("Pagination values must be integers"); return parsed; };
export class BillingController {
  constructor(private readonly useCase: IBillingUseCase) {}
  transactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try {
    const scope = this.scope(req.user!.role, req.user!.clinicId ?? null, req.user!.sub);
    const status = stringQuery(req.query.status);
    if (status && !["PENDING", "SUCCEEDED", "FAILED", "CANCELLED", "REFUNDED"].includes(status)) throw new BadRequestError("Payment status is invalid");
    const filters: BillingFilters = { page: pageQuery(req.query.page, 1), limit: pageQuery(req.query.limit, 20), from: dateQuery(req.query.from), to: dateQuery(req.query.to, true), status, appointmentId: stringQuery(req.query.appointmentId) };
    const result = await this.useCase.listTransactions(scope, filters);
    ApiResponse.paginated(res, "Transactions retrieved", result.items, { page: result.page, limit: result.limit, totalItems: result.totalItems, totalPages: result.totalPages });
  } catch (error) { next(error); } };
  summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try {
    const scope = this.scope(req.user!.role, req.user!.clinicId ?? null, req.user!.sub);
    if (scope.role === "DOCTOR") throw new ForbiddenError("Billing summaries are not available for doctors");
    ApiResponse.success(res, "Billing summary retrieved", await this.useCase.getSummary(scope, dateQuery(req.query.from), dateQuery(req.query.to, true)));
  } catch (error) { next(error); } };
  settlements = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try {
    const clinicScoped = req.user!.role === Role.CLINIC_ADMIN;
    const status = stringQuery(req.query.status);
    if (status && !Object.values(SettlementStatus).includes(status as SettlementStatus)) throw new BadRequestError("Settlement status is invalid");
    const filters: SettlementFilters = { page: pageQuery(req.query.page, 1), limit: pageQuery(req.query.limit, 20), from: dateQuery(req.query.from), to: dateQuery(req.query.to, true), status: status as SettlementStatus | null, clinicId: clinicScoped ? req.user!.clinicId ?? null : stringQuery(req.query.clinicId) };
    const result = await this.useCase.listSettlements(filters);
    ApiResponse.paginated(res, "Settlements retrieved", result.items, { page: result.page, limit: result.limit, totalItems: result.totalItems, totalPages: result.totalPages });
  } catch (error) { next(error); } };
  settlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try {
    const clinicId = req.user!.role === Role.CLINIC_ADMIN ? req.user!.clinicId : undefined;
    const id = req.params.settlementId; if (typeof id !== "string") throw new BadRequestError("Settlement ID is required");
    ApiResponse.success(res, "Settlement retrieved", await this.useCase.getSettlement(id, clinicId ?? undefined));
  } catch (error) { next(error); } };
  createSettlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try {
    const body = req.body as { clinicId?: unknown; paymentIds?: unknown; administrativeNote?: unknown };
    if (typeof body.clinicId !== "string" || !Array.isArray(body.paymentIds) || body.paymentIds.some((id) => typeof id !== "string") || (body.administrativeNote != null && typeof body.administrativeNote !== "string")) throw new BadRequestError("Settlement payload is invalid");
    const note = typeof body.administrativeNote === "string" ? body.administrativeNote.trim() || null : null;
    if (note && note.length > 2000) throw new BadRequestError("Administrative note is too long");
    ApiResponse.created(res, "Settlement created", await this.useCase.createSettlement({ clinicId: body.clinicId, paymentIds: body.paymentIds as string[], createdBy: req.user!.sub, note }));
  } catch (error) { next(error); } };
  updateSettlement = async (req: Request, res: Response, next: NextFunction): Promise<void> => { try {
    const body = req.body as { status?: unknown; externalPayoutReference?: unknown; failureReason?: unknown };
    if (body.status !== SettlementStatus.COMPLETED && body.status !== SettlementStatus.FAILED) throw new BadRequestError("Status must be COMPLETED or FAILED");
    if ((body.externalPayoutReference != null && typeof body.externalPayoutReference !== "string") || (body.failureReason != null && typeof body.failureReason !== "string")) throw new BadRequestError("Settlement update is invalid");
    const ref = typeof body.externalPayoutReference === "string" ? body.externalPayoutReference.trim() || null : null;
    const reason = typeof body.failureReason === "string" ? body.failureReason.trim() || null : null;
    if (body.status === SettlementStatus.FAILED && !reason) throw new BadRequestError("A failure reason is required");
    if (body.status === SettlementStatus.COMPLETED && reason) throw new BadRequestError("Failure reason is only valid for a failed settlement");
    if ((ref?.length ?? 0) > 200 || (reason?.length ?? 0) > 1000) throw new BadRequestError("Settlement reference or failure reason is too long");
    const id = req.params.settlementId; if (typeof id !== "string") throw new BadRequestError("Settlement ID is required");
    ApiResponse.success(res, "Settlement updated", await this.useCase.transitionSettlement({ id, actorId: req.user!.sub, status: body.status, externalPayoutReference: ref, failureReason: reason }));
  } catch (error) { next(error); } };
  private scope(role: Role, clinicId: string | null, userId: string): BillingScope {
    if (role === Role.SUPER_ADMIN) return { role: "SUPER_ADMIN" };
    if (!clinicId) throw new ForbiddenError("Account is not linked to a clinic");
    if (role === Role.CLINIC_ADMIN) return { role: "CLINIC_ADMIN", clinicId };
    if (role === Role.DOCTOR) return { role: "DOCTOR", clinicId, doctorUserId: userId };
    throw new ForbiddenError("Billing access is not available for this role");
  }
}
