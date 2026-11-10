import { api } from "@/shared/lib/http";
import type { RoleDashboard } from "@/shared/types";
import { API_ROUTES } from "@/shared/constants/apiRoutes";

type RoleDashboardRole = "PATIENT" | "DOCTOR" | "STAFF";
type ApiEnvelope<T> = { data?: T };

async function responseData<T>(request: Promise<ApiEnvelope<T>>): Promise<T> {
  const response = await request;
  if (!response.data)
    throw new Error("Dashboard information was not returned.");
  return response.data;
}

const dashboardPaths: Record<RoleDashboardRole, string> = {
  PATIENT: API_ROUTES.PATIENT.DASHBOARD,
  DOCTOR: API_ROUTES.DOCTOR.DASHBOARD,
  STAFF: API_ROUTES.STAFF.DASHBOARD,
};

export const roleDashboardService = {
  getDashboard: (role: RoleDashboardRole) =>
    responseData(api.get<ApiEnvelope<RoleDashboard>>(dashboardPaths[role])),
};
