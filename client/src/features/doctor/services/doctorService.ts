import { api, http } from '@/shared/lib/http';
import type { DoctorAvailability, DoctorAvailabilitySlots, DoctorConsultationFee, DoctorOnboardingDTO, DoctorOnboardingStep, DoctorProfile } from '@/shared/types';

type ApiEnvelope<T> = { data?: T };

async function responseData<T>(request: Promise<ApiEnvelope<T>>, fallback: string): Promise<T> {
  const response = await request;
  if (!response.data) throw new Error(fallback);
  return response.data;
}

export const doctorService = {
  getOnboarding: () => responseData(api.get<ApiEnvelope<DoctorOnboardingDTO>>('/doctor/onboarding'), 'Doctor onboarding data was not returned.'),
  updateOnboarding: (step: DoctorOnboardingStep, body: unknown) =>
    responseData(api.patch<ApiEnvelope<DoctorOnboardingDTO>>(`/doctor/onboarding/${step}`, body), 'Updated onboarding data was not returned.'),
  uploadOnboardingDocument: async (documentType: string, file: File) => {
    const safeType = documentType.trim().replace(/\s+/g, '_');
    const response = await http.post<ApiEnvelope<DoctorOnboardingDTO>>(`/doctor/onboarding/documents?documentType=${encodeURIComponent(safeType)}`, file, {
      headers: { 'Content-Type': file.type },
    });
    if (!response.data.data) throw new Error('Updated doctor documents were not returned.');
    return response.data.data;
  },
  getOnboardingDocument: async (documentType: string) => {
    const safeType = documentType.trim().replace(/\s+/g, '_');
    return (await http.get<Blob>(`/doctor/onboarding/documents/${encodeURIComponent(safeType)}`, { responseType: 'blob' })).data;
  },
  deleteOnboardingDocument: (documentType: string) =>
    responseData(api.delete<ApiEnvelope<DoctorOnboardingDTO>>(`/doctor/onboarding/documents/${encodeURIComponent(documentType.trim().replace(/\s+/g, '_'))}`), 'Updated doctor documents were not returned.'),
  getConsultationFee: () => responseData(api.get<ApiEnvelope<DoctorConsultationFee>>('/doctor/consultation-fee'), 'Consultation fee was not returned.'),
  getAvailability: () => responseData(api.get<ApiEnvelope<DoctorAvailability>>('/doctor/availability'), 'Doctor availability was not returned.'),
  configureAvailability: (body: Pick<DoctorAvailability, 'workingHours' | 'breaks' | 'slotDurationMinutes' | 'bufferTimeMinutes'>) =>
    responseData(api.put<ApiEnvelope<DoctorAvailability>>('/doctor/availability', body), 'Updated doctor availability was not returned.'),
  generateAvailabilitySlots: () => responseData(api.post<ApiEnvelope<DoctorAvailabilitySlots>>('/doctor/availability/slots'), 'Availability slots were not returned.'),
  getProfile: () => api.get<DoctorProfile>('/doctor/profile'),
  patchProfile: (body: unknown) => api.patch<DoctorProfile>('/doctor/profile', body),
  getUploadUrl: (file: File) => api.post<{ key: string; uploadUrl: string }>('/doctor/documents/upload-url', { fileName: file.name, contentType: file.type, fileSize: file.size }),
  addDocument: (documentType: string, documentKey: string) => api.post<DoctorProfile>('/doctor/documents', { documentType, documentKey }),
  getDocumentUrl: (type: string) => api.get<{ url: string }>(`/doctor/documents/${encodeURIComponent(type)}/download-url`),
  submitVerification: () => responseData(api.post<ApiEnvelope<DoctorOnboardingDTO>>('/doctor/verification/submit'), 'Doctor verification status was not returned.'),
};
