import { api } from '@/shared/lib/http';
import type { ClinicDashboard, ClinicDocument, ClinicProfile, DoctorDetail, DoctorSummary, Invitation, WorkingHour } from '@/shared/types';

const enc = encodeURIComponent;

export type RegisterClinicRequest = {
  admin: { name: string; email: string; password: string };
  clinic: { name: string };
};

type ApiEnvelope<T> = { data?: T };
async function responseData<T>(request: Promise<ApiEnvelope<T>>, fallback: string): Promise<T> {
  const response = await request;
  if (!response.data) throw new Error(fallback);
  return response.data;
}

export const clinicService = {
  register: (body: RegisterClinicRequest) => api.post('/clinic/register', body),
  dashboard: () => responseData(api.get<ApiEnvelope<ClinicDashboard>>('/clinic/dashboard'), 'Clinic dashboard data was not returned.'),
  getProfile: () => responseData(api.get<ApiEnvelope<ClinicProfile>>('/clinic/profile'), 'Clinic profile was not returned.'),
  updateProfile: (body: Partial<ClinicProfile>) => responseData(api.patch<ApiEnvelope<ClinicProfile>>('/clinic/profile', body), 'Updated clinic profile was not returned.'),
  saveSpecializations: (specializations: string[]) => api.put<string[]>('/clinic/specializations', { specializations }),
  saveWorkingHours: (workingHours: WorkingHour[]) => api.put<WorkingHour[]>('/clinic/working-hours', { workingHours }),
  getUploadUrl: (file: File) => api.post<{ key: string; uploadUrl: string }>('/clinic/documents/upload-url', { fileName: file.name, contentType: file.type, fileSize: file.size }),
  addDocument: (documentType: string, documentKey: string) => api.post<ClinicDocument[]>('/clinic/documents', { documentType, documentKey }),
  getDocumentUrl: (type: string) => api.get<{ url: string }>(`/clinic/documents/${enc(type)}/download-url`),
  invite: (body: { email: string; role: 'DOCTOR' | 'STAFF' }) => responseData(api.post<ApiEnvelope<Invitation>>('/clinic/invitations', body), 'Invitation details were not returned.'),
  listPendingInvitations: () => responseData(api.get<ApiEnvelope<Invitation[]>>('/clinic/invitations/pending'), 'Pending invitations were not returned.'),
  resendInvitation: (id: string) => responseData(api.post<ApiEnvelope<Invitation>>(`/clinic/invitations/${enc(id)}/resend`), 'Updated invitation details were not returned.'),
  listDoctors: () => api.get<DoctorSummary[]>('/clinic/doctors'),
  getDoctor: (id: string) => api.get<DoctorDetail>(`/clinic/doctors/${id}`),
  approveDoctor: (id: string) => api.post(`/clinic/doctors/${id}/approve`),
  rejectDoctor: (id: string, reason: string) => api.post(`/clinic/doctors/${id}/reject`, { reason }),
  setDoctorFee: (id: string, fee: number) => api.patch(`/clinic/doctors/${id}/fee`, { fee }),
  getDoctorDocumentUrl: (id: string, type: string) => api.get<{ url: string }>(`/clinic/doctors/${id}/documents/${enc(type)}/download-url`),
};
