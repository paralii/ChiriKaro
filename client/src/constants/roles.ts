import type { Role } from '@/store/slices/authSlice';

export const roleLabels: Record<Role, string> = {
  patient: 'Patient', doctor: 'Doctor', clinic_admin: 'Clinic', staff: 'Staff', super_admin: 'Super admin',
};
export const displayRoles: Record<string, string> = {
  patient: 'Patient', clinic: 'Clinic', 'super-admin': 'Super admin', doctor: 'Doctor', staff: 'Staff',
};
export const loginRole = {
  patient: 'PATIENT', clinic: 'CLINIC_ADMIN', doctor: 'DOCTOR', staff: 'STAFF', 'super-admin': 'SUPER_ADMIN',
} as const;
export type LoginRoleKey = keyof typeof loginRole;