import type { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";

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
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateClinicProfileDTO {
  clinicId: string;
  updates: unknown;
}
