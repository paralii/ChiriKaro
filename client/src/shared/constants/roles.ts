import type { Role } from '@/features/auth/store/authSlice';

export const roleLabels: Record<Role, string> = {
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  CLINIC_ADMIN: 'Clinic',
  STAFF: 'Staff',
  SUPER_ADMIN: 'Super admin',
};
export const displayRoles: Record<string, string> = {
  PATIENT: 'Patient',
  CLINIC_ADMIN: 'Clinic',
  SUPER_ADMIN: 'Super admin',
  DOCTOR: 'Doctor',
  STAFF: 'Staff',
};
export const loginRole = {
  patient: 'PATIENT',
  clinic: 'CLINIC_ADMIN',
  doctor: 'DOCTOR',
  staff: 'STAFF',
  'super-admin': 'SUPER_ADMIN',
} as const;

export type LoginRoleKey = keyof typeof loginRole;
