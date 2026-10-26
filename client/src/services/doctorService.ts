import { api } from '@/lib/http';
import type { DoctorProfile, Slot, SlotConfig, WorkingHour } from '@/types';

export const doctorService = {
  getProfile: () => api.get<DoctorProfile>('/doctor/profile'),
  patchProfile: (body: unknown) => api.patch<DoctorProfile>('/doctor/profile', body),
  saveAvailability: (workingHours: WorkingHour[]) => api.put<DoctorProfile>('/doctor/availability', { workingHours }),
  getSlotConfig: () => api.get<SlotConfig>('/doctor/slot-config'),
  saveSlotConfig: (body: Pick<SlotConfig, 'slotDuration' | 'bufferMinutes'>) => api.put<SlotConfig>('/doctor/slot-config', body),
  getUploadUrl: (file: File) => api.post<{ key: string; uploadUrl: string }>('/doctor/documents/upload-url', { fileName: file.name, contentType: file.type, fileSize: file.size }),
  addDocument: (documentType: string, documentKey: string) => api.post<DoctorProfile>('/doctor/documents', { documentType, documentKey }),
  getDocumentUrl: (type: string) => api.get<{ url: string }>(`/doctor/documents/${encodeURIComponent(type)}/download-url`),
  submitVerification: () => api.post<{ verificationStatus: string }>('/doctor/submit-verification'),
  generateSlots: () => api.post<Slot[]>('/doctor/generate-slots'),
};