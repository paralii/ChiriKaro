export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  CLINIC_ADMIN = "CLINIC_ADMIN",
  DOCTOR = "DOCTOR",
  STAFF = "STAFF",
  PATIENT = "PATIENT",
  DENTIST = "DOCTOR",
  RECEPTIONIST = "STAFF",
}

export const CLINIC_SCOPED_ROLES: Role[] = [
  Role.CLINIC_ADMIN,
  Role.DOCTOR,
  Role.STAFF,
];

export function requiresClinic(role: Role): boolean {
  return CLINIC_SCOPED_ROLES.includes(role);
}

export const INVITE_PERMISSIONS: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]: [Role.CLINIC_ADMIN],
  [Role.CLINIC_ADMIN]: [Role.DOCTOR, Role.STAFF],
  [Role.DOCTOR]: [],
  [Role.STAFF]: [],
  [Role.PATIENT]: [],
};