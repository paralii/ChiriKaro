import { API_ROUTES } from '@/shared/constants/apiRoutes';
import { api } from '@/shared/lib/http';
import type { Role } from '@/features/auth/store/authSlice';
export type BillingRole = Extract<Role, 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR'>;
export type Transaction = { paymentId: string; appointmentId: string; appointmentDate: string; clinicId: string; clinicName: string; doctorId: string; doctorName: string; patientId?: string; patientName?: string; amountMinor: number; currency: string; paymentStatus: string; refundReviewStatus: string; razorpayPaymentReference: string | null; settlementEligible: boolean; createdAt: string; updatedAt: string };
export type BillingSummary = { currency: 'INR'; grossCapturedCollectionsMinor: number; successfulPaymentCount: number; refundReviewAmountMinor: number; refundReviewCount: number; pendingSettlementAmountMinor: number; completedSettlementAmountMinor: number; pendingSettlementCount: number; completedSettlementCount: number };
export type Settlement = { settlementId: string; clinicId: string; clinicName: string; allocations: Array<{ paymentId: string; amountMinor: number }>; totalAmountMinor: number; currency: 'INR'; status: 'PENDING' | 'COMPLETED' | 'FAILED'; externalPayoutReference: string | null; administrativeNote: string | null; failureReason: string | null; createdBy: string; completedBy: string | null; failedBy: string | null; createdAt: string; updatedAt: string; completedAt: string | null; failedAt: string | null };
type Envelope<T> = { data?: T; meta?: { page: number; limit: number; totalItems: number; totalPages: number } };
const paths = { SUPER_ADMIN: API_ROUTES.BILLING.SUPER_ADMIN_TRANSACTIONS, CLINIC_ADMIN: API_ROUTES.BILLING.CLINIC_TRANSACTIONS, DOCTOR: API_ROUTES.BILLING.DOCTOR_TRANSACTIONS } satisfies Record<BillingRole, string>;
const query = (values: Record<string, string | number | undefined>) => { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); }); return params.toString(); };
export const billingService = {
  async transactions(role: BillingRole, filters: { page: number; limit: number; from: string; to: string; status: string }) {
    const result = await api.get<Envelope<Transaction[]>>(`${paths[role]}?${query(filters)}`);
    return { items: result.data ?? [], meta: result.meta ?? { page: 1, limit: filters.limit, totalItems: 0, totalPages: 0 } };
  },
  async summary(role: 'SUPER_ADMIN' | 'CLINIC_ADMIN', filters: { from: string; to: string }) {
    const path = role === 'SUPER_ADMIN' ? API_ROUTES.BILLING.SUPER_ADMIN_SUMMARY : API_ROUTES.BILLING.CLINIC_SUMMARY;
    const result = await api.get<Envelope<BillingSummary>>(`${path}?${query(filters)}`);
    if (!result.data) throw new Error('Billing summary was not returned.'); return result.data;
  },
  async settlements(role: 'SUPER_ADMIN' | 'CLINIC_ADMIN', filters: { page: number; limit: number; from: string; to: string; status: string }) {
    const base = role === 'SUPER_ADMIN' ? API_ROUTES.BILLING.SUPER_ADMIN_SETTLEMENTS : API_ROUTES.BILLING.CLINIC_SETTLEMENTS;
    const result = await api.get<Envelope<Settlement[]>>(`${base}?${query(filters)}`);
    return { items: result.data ?? [], meta: result.meta ?? { page: 1, limit: filters.limit, totalItems: 0, totalPages: 0 } };
  },
  async createSettlement(input: { clinicId: string; paymentIds: string[]; administrativeNote: string }) {
    const result = await api.post<Envelope<Settlement>>(API_ROUTES.BILLING.SUPER_ADMIN_SETTLEMENTS, input);
    if (!result.data) throw new Error('Settlement was not returned.'); return result.data;
  },
  async updateSettlement(id: string, input: { status: 'COMPLETED' | 'FAILED'; externalPayoutReference?: string; failureReason?: string }) {
    const result = await api.patch<Envelope<Settlement>>(API_ROUTES.BILLING.SETTLEMENT(API_ROUTES.BILLING.SUPER_ADMIN_SETTLEMENTS, id), input);
    if (!result.data) throw new Error('Updated settlement was not returned.'); return result.data;
  },
};
