export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  CLINIC_ADMIN = "CLINIC_ADMIN",
  DENTIST = "DENTIST",
  RECEPTIONIST = "RECEPTIONIST",
  PATIENT = "PATIENT",
}

export const CLINIC_SCOPED_ROLES: Role[] = [
  Role.CLINIC_ADMIN,
  Role.DENTIST,
  Role.RECEPTIONIST,
  Role.PATIENT,
];

export function requiresClinic(role: Role): boolean {
  return CLINIC_SCOPED_ROLES.includes(role);
}

export const INVITE_PERMISSIONS: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]: [Role.CLINIC_ADMIN],
  [Role.CLINIC_ADMIN]: [Role.DENTIST, Role.RECEPTIONIST],
  [Role.DENTIST]: [],
  [Role.RECEPTIONIST]: [],
  [Role.PATIENT]: [],
};