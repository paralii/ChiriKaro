import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { Role } from "@domain/value-objects/Role.ts";

export function canAccessClinicStatus(role: Role, status: ClinicStatus): boolean {
  if (status === ClinicStatus.APPROVED) return true;
  return role === Role.CLINIC_ADMIN &&
    (status === ClinicStatus.PENDING || status === ClinicStatus.REJECTED);
}
