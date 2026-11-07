import { api } from '@/shared/lib/http';
import type { PatientProfile } from '@/shared/types';

type ApiEnvelope<T> = { data?: T };

export const patientService = {
  updateProfile: async (body: { name?: string; avatar?: string | null }): Promise<PatientProfile> => {
    const response = await api.patch<ApiEnvelope<PatientProfile>>('/patient/profile', body);
    if (!response.data) throw new Error('Updated patient profile was not returned.');
    return response.data;
  },
};
