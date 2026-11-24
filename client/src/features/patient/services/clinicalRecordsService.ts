import { http } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';
type Envelope<T> = { data?: T };
export type FollowUp = { _id: string; consultationId: string; patientName: string; doctorUserId: string; scheduledAt: string; timeZone: string; timing: 'UPCOMING' | 'OVERDUE' | 'HISTORICAL'; reason: string; notes: string; status: string; rescheduleHistory: Array<{ from: string; to: string; changedAt: string }> };
export type TreatmentPlan = { _id: string; consultationId: string; title: string; diagnosis: string; status: string; version: number; previousVersionId: string | null; procedures: Array<{ procedure: string; affectedTeeth: string[]; estimatedCost: number | null; requiredSessions: number | null; instructions: string }>; estimatedTotal?: number };
export type PatientHealthRecord = { id: string; category: string | null; fileName: string; contentType: string; fileSize: number; uploadedAt: string };
const unwrap = <T>(response: { data: Envelope<T> }, message: string): T => { if (response.data.data === undefined) throw new Error(message); return response.data.data; };
export const clinicalRecordsService = {
  followUps: async () => unwrap(await http.get<Envelope<FollowUp[]>>(API_ROUTES.PATIENT.FOLLOW_UPS), 'Follow-ups were not returned.'),
  treatmentPlans: async () => unwrap(await http.get<Envelope<TreatmentPlan[]>>(API_ROUTES.PATIENT.TREATMENT_PLANS), 'Treatment plans were not returned.'),
  decide: async (id: string, decision: 'APPROVED' | 'REJECTED', note = '') => unwrap(await http.patch<Envelope<TreatmentPlan>>(API_ROUTES.PATIENT.TREATMENT_PLAN_DECISION(id), { decision, note }), 'Treatment plan decision was not returned.'),
  healthRecords: async () => unwrap(await http.get<Envelope<PatientHealthRecord[]>>(API_ROUTES.PATIENT.HEALTH_RECORDS), 'Health records were not returned.'),
  uploadHealthRecord: async (file: File, category: string) => {
    const response = await http.post<{ data?: PatientHealthRecord }>(API_ROUTES.PATIENT.HEALTH_RECORDS, file, { headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name), ...(category ? { 'X-Health-Record-Category': category } : {}) } });
    if (!response.data.data) throw new Error('The uploaded health record was not returned.');
    return response.data.data;
  },
  openHealthRecord: async (record: PatientHealthRecord, download = false) => {
    const response = await http.get<Blob>(`${API_ROUTES.PATIENT.HEALTH_RECORD(record.id)}${download ? '?download=true' : ''}`, { responseType: 'blob' });
    return window.URL.createObjectURL(response.data);
  },
};
