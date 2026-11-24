import { api } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';
import type { AnalyticsDTO, AnalyticsRange } from '@/shared/types';
import type { Role } from '@/features/auth/store/authSlice';

type Envelope<T> = { data?: T };
const paths: Partial<Record<Role, string>> = { SUPER_ADMIN: API_ROUTES.ANALYTICS.SUPER_ADMIN, CLINIC_ADMIN: API_ROUTES.ANALYTICS.CLINIC, DOCTOR: API_ROUTES.ANALYTICS.DOCTOR };
export const analyticsService = {
  async get(role: Role, range: AnalyticsRange): Promise<AnalyticsDTO> {
    const path = paths[role];
    if (!path) throw new Error('Analytics are not available for this role.');
    const response = await api.get<Envelope<AnalyticsDTO>>(`${path}?range=${range}`);
    if (!response.data) throw new Error('Analytics data was not returned.');
    return response.data;
  },
};
