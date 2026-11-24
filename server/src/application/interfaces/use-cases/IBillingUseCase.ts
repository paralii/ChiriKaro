import type { BillingFilters, BillingScope, BillingSummaryDTO, PageDTO, SettlementDTO, SettlementFilters, TransactionDTO } from "@application/dto/billing/billing.dto.ts";
import type { SettlementStatus } from "@domain/enum/settlement-status.enum.ts";
export interface IBillingUseCase {
  listTransactions(scope: BillingScope, filters: BillingFilters): Promise<PageDTO<TransactionDTO>>;
  getSummary(scope: Exclude<BillingScope, { role: "DOCTOR" }>, from: Date | null, to: Date | null): Promise<BillingSummaryDTO>;
  createSettlement(input: { clinicId: string; paymentIds: string[]; createdBy: string; note: string | null }): Promise<SettlementDTO>;
  listSettlements(filters: SettlementFilters): Promise<PageDTO<SettlementDTO>>;
  getSettlement(id: string, clinicId?: string): Promise<SettlementDTO>;
  transitionSettlement(input: { id: string; actorId: string; status: Exclude<SettlementStatus, "PENDING">; externalPayoutReference: string | null; failureReason: string | null }): Promise<SettlementDTO>;
}
