import type { Clinic } from "@domain/entities/clinic.entity.ts";
import type { ClinicSummaryDTO } from "@application/dto/super-admin/clinic-management.dto.ts";

export const toClinicSummaryDTO = (clinic: Clinic): ClinicSummaryDTO => ({
  id: clinic.id!,
  name: clinic.name,
  address: clinic.address ?? null,
  phone: clinic.phone ?? null,
  contactEmail: clinic.contactEmail ?? null,
  ownerAdminId: clinic.ownerAdminId,
  status: clinic.status,
  setupStatus: clinic.setupStatus,
  createdAt: clinic.createdAt,
  updatedAt: clinic.updatedAt,
});
