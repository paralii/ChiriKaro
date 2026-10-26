import { api } from '@/lib/http';
import type { Clinic, ClinicDocument, ClinicProfile, DoctorDetail, DoctorSummary, Invitation, WorkingHour } from '@/types';

const enc = encodeURIComponent;

export const clinicService = {
  register: (body: Record<string, string>) => api.post('/clinics/register', body),
  dashboard: () => api.get<Clinic>('/clinic/dashboard'),
  getProfile: () => api.get<ClinicProfile>('/clinic/profile'),
  updateProfile: (body: Partial<ClinicProfile>) => api.patch<ClinicProfile>('/clinic/profile', body),
  saveSpecializations: (specializations: string[]) => api.put<string[]>('/clinic/specializations', { specializations }),
  saveWorkingHours: (workingHours: WorkingHour[]) => api.put<WorkingHour[]>('/clinic/working-hours', { workingHours }),
  getUploadUrl: (file: File) => api.post<{ key: string; uploadUrl: string }>('/clinic/documents/upload-url', { fileName: file.name, contentType: file.type, fileSize: file.size }),
  addDocument: (documentType: string, documentKey: string) => api.post<ClinicDocument[]>('/clinic/documents', { documentType, documentKey }),
  getDocumentUrl: (type: string) => api.get<{ url: string }>(`/clinic/documents/${enc(type)}/download-url`),
  invite: (body: { clinicId: string; email: string; role: 'DOCTOR' | 'STAFF' }) => api.post<Invitation>('/clinic/invite', body),
  listDoctors: () => api.get<DoctorSummary[]>('/clinic/doctors'),
  getDoctor: (id: string) => api.get<DoctorDetail>(`/clinic/doctors/${id}`),
  approveDoctor: (id: string) => api.post(`/clinic/doctors/${id}/approve`),
  rejectDoctor: (id: string, reason: string) => api.post(`/clinic/doctors/${id}/reject`, { reason }),
  setDoctorFee: (id: string, fee: number) => api.patch(`/clinic/doctors/${id}/fee`, { fee }),
  getDoctorDocumentUrl: (id: string, type: string) => api.get<{ url: string }>(`/clinic/doctors/${id}/documents/${enc(type)}/download-url`),
};