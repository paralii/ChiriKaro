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
  setupStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicDetailsDTO extends ClinicSummaryDTO {
  city: string | null;
  state: string | null;
  pincode: string | null;
  registrationNumber: string | null;
  specializations: string[];
  workingHours: Array<{ day: string; isOpen: boolean; startTime: string; endTime: string }>;
  documents: Array<{ documentType: string; uploadedAt: Date }>;
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
