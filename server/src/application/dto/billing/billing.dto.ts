import type { SettlementStatus } from "@domain/enum/settlement-status.enum.ts";
export type BillingScope = { role: "SUPER_ADMIN" } | { role: "CLINIC_ADMIN"; clinicId: string } | { role: "DOCTOR"; clinicId: string; doctorUserId: string };
export interface BillingFilters { page: number; limit: number; from: Date | null; to: Date | null; status: string | null; appointmentId: string | null }
export interface TransactionDTO {
  paymentId: string; appointmentId: string; appointmentDate: string; clinicId: string; clinicName: string;
  doctorId: string; doctorName: string; patientId?: string; patientName?: string; amountMinor: number;
  currency: string; paymentStatus: string; refundReviewStatus: string; razorpayPaymentReference: string | null;
  settlementEligible: boolean;
  createdAt: string; updatedAt: string;
}
export interface PageDTO<T> { items: T[]; page: number; limit: number; totalItems: number; totalPages: number }
export interface BillingSummaryDTO {
  currency: "INR"; grossCapturedCollectionsMinor: number; successfulPaymentCount: number;
  refundReviewAmountMinor: number; refundReviewCount: number; pendingSettlementAmountMinor: number;
  completedSettlementAmountMinor: number; pendingSettlementCount: number; completedSettlementCount: number;
}
export interface SettlementDTO {
  settlementId: string; clinicId: string; clinicName: string; allocations: Array<{ paymentId: string; amountMinor: number }>;
  totalAmountMinor: number; currency: "INR"; status: SettlementStatus; externalPayoutReference: string | null;
  administrativeNote: string | null; failureReason: string | null; createdBy: string; completedBy: string | null;
  failedBy: string | null; createdAt: string; updatedAt: string; completedAt: string | null; failedAt: string | null;
}
export interface SettlementFilters { page: number; limit: number; from: Date | null; to: Date | null; status: SettlementStatus | null; clinicId: string | null }
