import type { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";

export interface ClinicListQueryDTO {
  page?: unknown;
  limit?: unknown;
}

export interface ClinicSummaryDTO {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  contactEmail: string | null;
  ownerAdminId: string | null;
  status: ClinicStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicListResultDTO {
  clinics: ClinicSummaryDTO[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface UpdateClinicStatusDTO {
  clinicId: string;
  status: unknown;
}
