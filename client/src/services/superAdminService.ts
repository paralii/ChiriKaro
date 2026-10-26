import { api } from '@/lib/http';
import type { Clinic, ClinicStatus, ClinicSummary } from '@/types';

export const superAdminService = {
  listClinics: () => api.get<Clinic[]>('/super-admin/clinics'),
  getSummary: () => api.get<ClinicSummary>('/super-admin/clinics/dashboard'),
  updateStatus: (id: string, status: ClinicStatus) => api.patch(`/super-admin/clinics/${id}/status`, { status }),
};