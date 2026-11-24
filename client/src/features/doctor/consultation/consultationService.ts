import { api, http, type ApiResponse } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';

export type MedicalHistory = { existingConditions: string[]; allergies: string[]; medications: string[]; previousSurgeries: string[]; dentalHistory: string; remarks: string };
export type ConsultationData = {
  chiefComplaint: string; symptoms: string[]; painLevel: number | null; examinationFindings: string; clinicalNotes: string;
  dentalChart: Array<{ toothNumber: string; condition: string; affectedSurface: string; observations: string }>;
  diagnoses: Array<{ diagnosis: string; affectedTeeth: string[]; severity: string; remarks: string }>;
  treatmentPlan: Array<{ procedure: string; affectedTeeth: string[]; estimatedCost: number | null; numberOfSessions: number | null; instructions: string }>;
  prescriptions: Array<{ medicine: string; dosage: string; frequency: string; duration: string; instructions: string }>;
};
export type Consultation = { id: string; queueEntryId: string; clinicId: string; doctorUserId: string; patientUserId: string | null; patientNameSnapshot: string; appointmentId: string | null; visitDetails: { localDate: string; localStartTime: string | null; localEndTime: string | null; tokenNumber: number; clinicName: string }; status: 'IN_PROGRESS' | 'COMPLETED'; medicalHistorySnapshot: MedicalHistory; data: ConsultationData; attachments: Array<{ id: string; category: string; fileName: string; contentType: string; uploadedAt: string }>; startedAt: string; completedAt: string | null; createdAt: string; updatedAt: string };
const emptyData: ConsultationData = { chiefComplaint: '', symptoms: [], painLevel: null, examinationFindings: '', clinicalNotes: '', dentalChart: [], diagnoses: [], treatmentPlan: [], prescriptions: [] };
const emptyHistory: MedicalHistory = { existingConditions: [], allergies: [], medications: [], previousSurgeries: [], dentalHistory: '', remarks: '' };
function data<T>(r: ApiResponse<T>, message: string): T { if (r.data === undefined) throw new Error(message); return r.data; }
export const consultationService = {
  emptyData, emptyHistory,
  open: async (queueEntryId: string) => data(await api.post<ApiResponse<Consultation>>(API_ROUTES.DOCTOR.CONSULTATION_OPEN(queueEntryId)), 'Consultation was not returned.'),
  get: async (id: string) => data(await api.get<ApiResponse<Consultation>>(API_ROUTES.DOCTOR.CONSULTATION(id)), 'Consultation was not returned.'),
  save: async (id: string, body: { data: ConsultationData; medicalHistorySnapshot: MedicalHistory }) => data(await api.put<ApiResponse<Consultation>>(API_ROUTES.DOCTOR.CONSULTATION(id), body), 'Saved consultation was not returned.'),
  finalize: async (id: string) => data(await api.post<ApiResponse<Consultation>>(API_ROUTES.DOCTOR.CONSULTATION_FINALIZE(id)), 'Finalized consultation was not returned.'),
  history: async (patientId: string) => data(await api.get<ApiResponse<Consultation[]>>(API_ROUTES.DOCTOR.CONSULTATION_RECORDS(patientId)), 'Previous consultations were not returned.'),
  getMedicalHistory: async (patientId: string) => data(await api.get<ApiResponse<{ history: MedicalHistory; updatedBy: string | null; updatedAt: string | null }>>(API_ROUTES.DOCTOR.CONSULTATION_HISTORY(patientId)), 'Medical history was not returned.'),
  updateHistory: async (patientId: string, history: MedicalHistory) => data(await api.put<ApiResponse<{ history: MedicalHistory; updatedBy: string; updatedAt: string }>>(API_ROUTES.DOCTOR.CONSULTATION_HISTORY(patientId), history), 'Updated medical history was not returned.'),
  upload: async (id: string, file: File, category: string) => {
    const response = await http.post<ApiResponse<Consultation>>(API_ROUTES.DOCTOR.CONSULTATION_ATTACHMENTS(id), file, { headers: { 'Content-Type': file.type, 'X-File-Name': file.name, 'X-Attachment-Category': category } });
    return data(response.data, 'Attachment was not saved.');
  },
  download: async (id: string, attachmentId: string) => (await http.get<Blob>(API_ROUTES.DOCTOR.CONSULTATION_ATTACHMENT(id, attachmentId), { responseType: 'blob' })).data,
  removeAttachment: async (id: string, attachmentId: string) => api.delete<ApiResponse<void>>(API_ROUTES.DOCTOR.CONSULTATION_ATTACHMENT(id, attachmentId)),
};
