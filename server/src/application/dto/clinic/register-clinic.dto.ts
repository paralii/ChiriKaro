import type { Role } from "@domain/value-objects/Role.ts";
import type { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";

export interface RegisterClinicDTO {
  admin: {
    name: string;
    email: string;
    password: string;
  };
  clinic: {
    name: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    phone?: string | null;
    contactEmail?: string | null;
    registrationNumber?: string | null;
  };
}

export interface RegisterClinicResultDTO {
  clinic: {
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
  };
  admin: {
    id: string;
    name: string;
    email: string;
    role: Role;
    clinicId: string | null;
  };
  message: string;
}
