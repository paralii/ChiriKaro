import { api } from '@/shared/lib/http';
import type { Clinic, ClinicStatus, ClinicSummary } from '@/shared/types';

type ApiEnvelope<T> = { data?: T; meta?: { page: number; limit: number; totalItems: number; totalPages: number } };
export type ClinicPage = { items: Clinic[]; page: number; limit: number; totalItems: number; totalPages: number };
type SuperAdminStatistics = { clinics: { total: number; approved: number; pending: number; blocked: number } };

export const superAdminService = {
  listClinics: async (page = 1, limit = 20): Promise<ClinicPage> => {
    const response = await api.get<ApiEnvelope<Clinic[]>>(`/super-admin/clinics?page=${page}&limit=${limit}`);
    return {
      items: response.data ?? [],
      page: response.meta?.page ?? page,
      limit: response.meta?.limit ?? limit,
      totalItems: response.meta?.totalItems ?? 0,
      totalPages: response.meta?.totalPages ?? 0,
    };
  },
  getClinic: async (id: string) => {
    const response = await api.get<ApiEnvelope<Clinic>>(`/super-admin/clinics/${encodeURIComponent(id)}`);
    if (!response.data) throw new Error('Clinic details were not returned.');
    return response.data;
  },
  getSummary: async (): Promise<ClinicSummary> => {
    const response = await api.get<ApiEnvelope<SuperAdminStatistics>>('/super-admin/statistics');
    const clinics = response.data?.clinics;
    if (!clinics) throw new Error('Clinic statistics were not returned.');
    return {
      ...clinics,
      rejected: Math.max(0, clinics.total - clinics.approved - clinics.pending - clinics.blocked),
    };
  },
  updateStatus: async (id: string, status: ClinicStatus) => {
    const response = await api.patch<ApiEnvelope<Clinic>>(`/super-admin/clinics/${encodeURIComponent(id)}/status`, { status });
    if (!response.data) throw new Error('Updated clinic details were not returned.');
    return response.data;
  },
};
