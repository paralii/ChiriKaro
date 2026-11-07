import { api, http } from '@/shared/lib/http';
import type { ClinicDashboard, ClinicProfile, DoctorConsultationFee, DoctorDetail, DoctorOnboardingDTO, DoctorSummary, DoctorVerificationSummary, Invitation, WorkingHour } from '@/shared/types';

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
  updateSetup: (body: { location?: Pick<ClinicProfile, 'address' | 'city' | 'state' | 'pincode'>; specializations?: string[]; workingHours?: WorkingHour[] }) =>
    responseData(api.patch<ApiEnvelope<ClinicProfile>>('/clinic/setup', body), 'Clinic setup was not returned.'),
  submitSetup: () => responseData(api.post<ApiEnvelope<ClinicProfile>>('/clinic/setup/submit'), 'Clinic setup submission was not returned.'),
  uploadDocument: async (documentType: string, file: File) => {
    const safeType = documentType.trim().replace(/\s+/g, '_');
    const response = await http.post<ApiEnvelope<ClinicProfile>>(`/clinic/setup/documents?documentType=${enc(safeType)}`, file, {
      headers: { 'Content-Type': file.type },
    });
    if (!response.data.data) throw new Error('Updated clinic documents were not returned.');
    return response.data.data;
  },
  getDocument: async (type: string) => {
    const safeType = type.trim().replace(/\s+/g, '_');
    return (await http.get<Blob>(`/clinic/setup/documents/${enc(safeType)}`, { responseType: 'blob' })).data;
  },
  invite: (body: { email: string; role: 'DOCTOR' | 'STAFF' }) => responseData(api.post<ApiEnvelope<Invitation>>('/clinic/invitations', body), 'Invitation details were not returned.'),
  listPendingInvitations: () => responseData(api.get<ApiEnvelope<Invitation[]>>('/clinic/invitations/pending'), 'Pending invitations were not returned.'),
  resendInvitation: (id: string) => responseData(api.post<ApiEnvelope<Invitation>>(`/clinic/invitations/${enc(id)}/resend`), 'Updated invitation details were not returned.'),
  listPendingDoctorVerifications: () => responseData(api.get<ApiEnvelope<DoctorVerificationSummary[]>>('/clinic/doctors/pending-verification'), 'Pending doctor verifications were not returned.'),
  getDoctorVerification: (id: string) => responseData(api.get<ApiEnvelope<DoctorOnboardingDTO>>(`/clinic/doctors/${enc(id)}/verification`), 'Doctor verification details were not returned.'),
  approveDoctorVerification: (id: string) => responseData(api.post<ApiEnvelope<DoctorOnboardingDTO>>(`/clinic/doctors/${enc(id)}/verification/approve`), 'Doctor approval was not returned.'),
  rejectDoctorVerification: (id: string, reason: string) => responseData(api.post<ApiEnvelope<DoctorOnboardingDTO>>(`/clinic/doctors/${enc(id)}/verification/reject`, { reason }), 'Doctor rejection was not returned.'),
  getDoctorVerificationDocument: async (id: string, type: string) => (await http.get<Blob>(`/clinic/doctors/${enc(id)}/verification/documents/${enc(type.trim().replace(/\s+/g, '_'))}`, { responseType: 'blob' })).data,
  setDoctorFee: (id: string, consultationFee: number) => responseData(
    api.patch<ApiEnvelope<DoctorConsultationFee>>(`/clinic/doctors/${enc(id)}/consultation-fee`, { consultationFee }),
    'Updated consultation fee was not returned.',
  ),
  listDoctors: () => api.get<DoctorSummary[]>('/clinic/doctors'),
  getDoctor: (id: string) => api.get<DoctorDetail>(`/clinic/doctors/${id}`),
  approveDoctor: (id: string) => api.post(`/clinic/doctors/${id}/approve`),
  rejectDoctor: (id: string, reason: string) => api.post(`/clinic/doctors/${id}/reject`, { reason }),
  getDoctorDocumentUrl: (id: string, type: string) => api.get<{ url: string }>(`/clinic/doctors/${id}/documents/${enc(type)}/download-url`),
};
