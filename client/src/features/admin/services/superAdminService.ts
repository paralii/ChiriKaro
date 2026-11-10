import { api, http } from "@/shared/lib/http";
import type {
  Clinic,
  ClinicStatus,
  ClinicSummary,
  SuperAdminStatistics,
} from "@/shared/types";
import { API_ROUTES } from "@/shared/constants/apiRoutes";

type ApiEnvelope<T> = {
  data?: T;
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
};
export type ClinicPage = {
  items: Clinic[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};
type SuperAdminStatisticsResponse = {
  clinics: {
    total: number;
    approved: number;
    pending: number;
    blocked: number;
  };
  doctors: SuperAdminStatistics["doctors"];
};

export const superAdminService = {
  listClinics: async (page = 1, limit = 20): Promise<ClinicPage> => {
    const response = await api.get<ApiEnvelope<Clinic[]>>(
      `${API_ROUTES.SUPER_ADMIN.CLINICS}?page=${page}&limit=${limit}`,
    );
    return {
      items: response.data ?? [],
      page: response.meta?.page ?? page,
      limit: response.meta?.limit ?? limit,
      totalItems: response.meta?.totalItems ?? 0,
      totalPages: response.meta?.totalPages ?? 0,
    };
  },
  getClinic: async (id: string) => {
    const response = await api.get<ApiEnvelope<Clinic>>(
      API_ROUTES.SUPER_ADMIN.CLINIC_DETAILS(id),
    );
    if (!response.data) throw new Error("Clinic details were not returned.");
    return response.data;
  },
  getClinicDocument: async (id: string, documentType: string) =>
    (
      await http.get<Blob>(
        `${API_ROUTES.SUPER_ADMIN.CLINIC_DOCUMENTS(id, documentType)}`,
        { responseType: "blob" },
      )
    ).data,
  getStatistics: async (): Promise<SuperAdminStatistics> => {
    const response = await api.get<ApiEnvelope<SuperAdminStatisticsResponse>>(
      	API_ROUTES.SUPER_ADMIN.STATISTICS,
    );
    const statistics = response.data;
    if (!statistics?.clinics || !statistics.doctors)
      throw new Error("Super Admin statistics were not returned.");
    const clinics: ClinicSummary = {
      ...statistics.clinics,
      rejected: Math.max(
        0,
        statistics.clinics.total -
          statistics.clinics.approved -
          statistics.clinics.pending -
          statistics.clinics.blocked,
      ),
    };
    return { clinics, doctors: statistics.doctors };
  },
  getSummary: async (): Promise<ClinicSummary> => {
    const statistics = await superAdminService.getStatistics();
    return statistics.clinics;
  },
  updateStatus: async (id: string, status: ClinicStatus) => {
    const response = await api.patch<ApiEnvelope<Clinic>>(
      `${API_ROUTES.SUPER_ADMIN.CLINIC_STATUS(id)}`,
      { status },
    );
    if (!response.data)
      throw new Error("Updated clinic details were not returned.");
    return response.data;
  },
};
