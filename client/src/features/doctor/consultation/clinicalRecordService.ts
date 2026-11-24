import { http } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';
type E<T> = { data?: T };
const data = <T>(r: { data: E<T> }, message: string): T => { if (r.data.data === undefined) throw new Error(message); return r.data.data; };
export type FollowUp = { _id: string; consultationId: string; patientName: string; scheduledAt: string; reason: string; notes: string; status: string; timeZone: string };
export type TreatmentPlan = { _id: string; consultationId: string; title: string; diagnosis: string; procedures: Array<{ procedure: string; affectedTeeth: string[]; estimatedCost: number | null; requiredSessions: number | null; instructions: string }>; status: string; version: number };
export const clinicalRecordService = {
  followUps: async () => data(await http.get<E<FollowUp[]>>(API_ROUTES.DOCTOR.FOLLOW_UPS), 'Follow-ups were not returned.'),
  plans: async () => data(await http.get<E<TreatmentPlan[]>>(API_ROUTES.DOCTOR.TREATMENT_PLANS), 'Treatment plans were not returned.'),
  createFollowUp: async (id: string, payload: { date: string; time: string; reason: string; notes: string }) => data(await http.post<E<FollowUp>>(API_ROUTES.DOCTOR.FOLLOW_UPS_FOR_CONSULTATION(id), payload), 'Follow-up was not created.'),
  updateFollowUp: async (id: string, payload: { date?: string; time?: string; status?: string; reason?: string; notes?: string }) => data(await http.patch<E<FollowUp>>(API_ROUTES.DOCTOR.FOLLOW_UP(id), payload), 'Follow-up was not updated.'),
  createPlan: async (id: string, payload: Omit<TreatmentPlan, '_id' | 'consultationId' | 'status' | 'version'>) => data(await http.post<E<TreatmentPlan>>(API_ROUTES.DOCTOR.TREATMENT_PLANS_FOR_CONSULTATION(id), payload), 'Treatment plan was not created.'),
  updatePlan: async (id: string, payload: Partial<TreatmentPlan>) => data(await http.put<E<TreatmentPlan>>(API_ROUTES.DOCTOR.TREATMENT_PLAN(id), payload), 'Treatment plan was not updated.'),
  deletePlan: async (id: string) => http.delete(API_ROUTES.DOCTOR.DELETE_TREATMENT_PLAN(id)),
  submitPlan: async (id: string) => data(await http.post<E<TreatmentPlan>>(API_ROUTES.DOCTOR.TREATMENT_PLAN_SUBMIT(id)), 'Treatment plan was not submitted.'),
  revisePlan: async (id: string, payload: Partial<TreatmentPlan>) => data(await http.post<E<TreatmentPlan>>(API_ROUTES.DOCTOR.TREATMENT_PLAN_REVISE(id), payload), 'Treatment plan revision was not created.'),
  transitionPlan: async (id: string, status: string, note?: string) => data(await http.patch<E<TreatmentPlan>>(API_ROUTES.DOCTOR.TREATMENT_PLAN_STATUS(id), { status, note }), 'Treatment plan status was not updated.'),
};
