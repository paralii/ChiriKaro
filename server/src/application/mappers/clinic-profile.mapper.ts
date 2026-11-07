import type { Clinic } from "@domain/entities/clinic.entity.ts";
import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";

export const toClinicProfileDTO = (clinic: Clinic): ClinicProfileDTO => ({
  id: clinic.id!,
  name: clinic.name,
  address: clinic.address ?? null,
  city: clinic.city ?? null,
  state: clinic.state ?? null,
  pincode: clinic.pincode ?? null,
  phone: clinic.phone ?? null,
  contactEmail: clinic.contactEmail ?? null,
  registrationNumber: clinic.registrationNumber ?? null,
  ownerAdminId: clinic.ownerAdminId,
  status: clinic.status,
  createdAt: clinic.createdAt,
  updatedAt: clinic.updatedAt,
});
