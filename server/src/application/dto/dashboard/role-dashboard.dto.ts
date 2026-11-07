import type { Role } from "@domain/value-objects/Role.ts";
import type { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";

export interface RoleDashboardDTO {
  user: {
    id: string;
    name: string;
    role: Role;
    clinicId: string | null;
  };
  clinic: {
    id: string;
    name: string;
    status: ClinicStatus;
  } | null;
}
