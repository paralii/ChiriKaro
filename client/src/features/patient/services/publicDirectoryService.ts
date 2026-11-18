import { api } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';
import type { PublicDirectoryPage } from '@/shared/types';

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
};
