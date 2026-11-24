import { http } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';
type Envelope<T> = { data?: T };
export type FollowUp = { _id: string; consultationId: string; patientName: string; doctorUserId: string; scheduledAt: string; timeZone: string; timing: 'UPCOMING' | 'OVERDUE' | 'HISTORICAL'; reason: string; notes: string; status: string; rescheduleHistory: Array<{ from: string; to: string; changedAt: string }> };
export type TreatmentPlan = { _id: string; consultationId: string; title: string; diagnosis: string; status: string; version: number; previousVersionId: string | null; procedures: Array<{ procedure: string; affectedTeeth: string[]; estimatedCost: number | null; requiredSessions: number | null; instructions: string }>; estimatedTotal?: number };
const unwrap = <T>(response: { data: Envelope<T> }, message: string): T => { if (response.data.data === undefined) throw new Error(message); return response.data.data; };
export const clinicalRecordsService = {
  followUps: async () => unwrap(await http.get<Envelope<FollowUp[]>>(API_ROUTES.PATIENT.FOLLOW_UPS), 'Follow-ups were not returned.'),
  treatmentPlans: async () => unwrap(await http.get<Envelope<TreatmentPlan[]>>(API_ROUTES.PATIENT.TREATMENT_PLANS), 'Treatment plans were not returned.'),
  decide: async (id: string, decision: 'APPROVED' | 'REJECTED', note = '') => unwrap(await http.patch<Envelope<TreatmentPlan>>(API_ROUTES.PATIENT.TREATMENT_PLAN_DECISION(id), { decision, note }), 'Treatment plan decision was not returned.'),
};
