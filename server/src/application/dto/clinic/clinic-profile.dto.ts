import type { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import type { ClinicSetupStatus } from "@domain/enum/clinic-setup-status.enum.ts";
import type { ClinicWorkingHour } from "@domain/entities/clinic.entity.ts";

export interface ClinicDocumentDTO {
  documentType: string;
  uploadedAt: Date;
}

export interface ClinicProfileDTO {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  contactEmail: string | null;
  registrationNumber: string | null;
  ownerAdminId: string | null;
  status: ClinicStatus;
  specializations: string[];
  workingHours: ClinicWorkingHour[];
  documents: ClinicDocumentDTO[];
  setupStatus: ClinicSetupStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateClinicProfileDTO {
  clinicId: string;
  updates: unknown;
}
