import { api } from '@/shared/lib/http';
import type { RoleDashboard } from '@/shared/types';

type RoleDashboardRole = 'PATIENT' | 'DOCTOR' | 'STAFF';
type ApiEnvelope<T> = { data?: T };

async function responseData<T>(request: Promise<ApiEnvelope<T>>): Promise<T> {
  const response = await request;
  if (!response.data) throw new Error('Dashboard information was not returned.');
  return response.data;
}

const dashboardPaths: Record<RoleDashboardRole, string> = {
  PATIENT: '/patient/dashboard',
  DOCTOR: '/doctor/dashboard',
  STAFF: '/staff/dashboard',
};

export const roleDashboardService = {
  getDashboard: (role: RoleDashboardRole) => responseData(api.get<ApiEnvelope<RoleDashboard>>(dashboardPaths[role])),
};
