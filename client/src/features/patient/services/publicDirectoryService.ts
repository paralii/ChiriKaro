import { api } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';
import type { DatedAvailability, PublicClinicProfile, PublicDirectoryPage, PublicDoctorProfile } from '@/shared/types';

export type PublicDirectoryFilters = { q?: string; city?: string; specialization?: string; page?: number; limit?: number };

export const publicDirectoryService = {
  search: (filters: PublicDirectoryFilters) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
    return api.get<{ success: boolean; message: string; data: PublicDirectoryPage['items']; meta: Omit<PublicDirectoryPage, 'items'> }>(`${API_ROUTES.SEARCH.DIRECTORY}?${params.toString()}`).then((response) => {
      if (!response.meta) throw new Error('Search pagination was not returned.');
      return { items: response.data ?? [], ...response.meta };
    });
  },
  availability: (listingId: string, date: string) =>
    api.get<{ success: boolean; message: string; data?: DatedAvailability }>(`${API_ROUTES.SEARCH.DIRECTORY_AVAILABILITY(listingId)}?date=${encodeURIComponent(date)}`).then((response) => {
      if (!response.data) throw new Error('Date-specific availability was not returned.');
      return response.data;
    }),
  clinicProfile: (listingId: string) =>
    api.get<{ data?: PublicClinicProfile }>(API_ROUTES.SEARCH.DIRECTORY_CLINIC_PROFILE(listingId)).then((response) => {
      if (!response.data) throw new Error('Clinic profile was not returned.');
      return response.data;
    }),
  doctorProfile: (listingId: string) =>
    api.get<{ data?: PublicDoctorProfile }>(API_ROUTES.SEARCH.DIRECTORY_DOCTOR_PROFILE(listingId)).then((response) => {
      if (!response.data) throw new Error('Doctor profile was not returned.');
      return response.data;
    }),
};
