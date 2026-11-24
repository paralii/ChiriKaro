import type { IBillingRepository } from "@application/interfaces/repositories/IBillingRepository.ts";
import type { IBillingUseCase } from "@application/interfaces/use-cases/IBillingUseCase.ts";
import type { BillingFilters, BillingScope, BillingSummaryDTO, PageDTO, SettlementDTO, SettlementFilters, TransactionDTO } from "@application/dto/billing/billing.dto.ts";
import type { SettlementStatus } from "@domain/enum/settlement-status.enum.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";
const isObjectId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);
export class BillingUseCase implements IBillingUseCase {
  constructor(private readonly repository: IBillingRepository) {}
  listTransactions(scope: BillingScope, filters: BillingFilters): Promise<PageDTO<TransactionDTO>> { this.validateFilters(filters); return this.repository.listTransactions(scope, filters); }
  getSummary(scope: Exclude<BillingScope, { role: "DOCTOR" }>, from: Date | null, to: Date | null): Promise<BillingSummaryDTO> { this.validateDates(from, to); return this.repository.getSummary(scope, from, to); }
  async createSettlement(input: { clinicId: string; paymentIds: string[]; createdBy: string; note: string | null }): Promise<SettlementDTO> {
    if (!isObjectId(input.clinicId) || !isObjectId(input.createdBy)) throw new BadRequestError("Clinic or user identity is invalid");
    if (!input.paymentIds.length || input.paymentIds.length > 100 || input.paymentIds.some((id) => !isObjectId(id)) || new Set(input.paymentIds).size !== input.paymentIds.length) throw new BadRequestError("Provide between 1 and 100 unique valid payment IDs");
    return this.repository.createSettlement(input);
  }
  listSettlements(filters: SettlementFilters): Promise<PageDTO<SettlementDTO>> {
    if (!Number.isSafeInteger(filters.page) || filters.page < 1 || !Number.isSafeInteger(filters.limit) || filters.limit < 1 || filters.limit > 100) throw new BadRequestError("Page must be positive and limit must be between 1 and 100");
    if (filters.clinicId && !isObjectId(filters.clinicId)) throw new BadRequestError("Clinic ID is invalid");
    this.validateDates(filters.from, filters.to); return this.repository.listSettlements(filters);
  }
  async getSettlement(id: string, clinicId?: string): Promise<SettlementDTO> {
    if (!isObjectId(id)) throw new BadRequestError("Settlement ID is invalid");
    const result = await this.repository.getSettlement(id, clinicId);
    if (!result) throw new NotFoundError("Settlement");
    return result;
  }
  async transitionSettlement(input: { id: string; actorId: string; status: Exclude<SettlementStatus, "PENDING">; externalPayoutReference: string | null; failureReason: string | null }): Promise<SettlementDTO> {
    if (!isObjectId(input.id) || !isObjectId(input.actorId)) throw new BadRequestError("Settlement or user identity is invalid");
    const result = await this.repository.transitionSettlement(input);
    if (!result) throw new NotFoundError("Pending settlement");
    return result;
  }
  private validateFilters(filters: BillingFilters): void {
    if (!Number.isSafeInteger(filters.page) || filters.page < 1 || !Number.isSafeInteger(filters.limit) || filters.limit < 1 || filters.limit > 100) throw new BadRequestError("Page must be positive and limit must be between 1 and 100");
    this.validateDates(filters.from, filters.to);
    if (filters.appointmentId && !isObjectId(filters.appointmentId)) throw new BadRequestError("Appointment ID is invalid");
  }
  private validateDates(from: Date | null, to: Date | null): void { if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())) || (from && to && from > to)) throw new BadRequestError("Date range is invalid"); }
}
