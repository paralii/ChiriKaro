import type { Role } from '@/features/auth/store/authSlice';

export type NavEntry = { path: string; label: string };

export const navItems: Record<Role, NavEntry[]> = {
  SUPER_ADMIN: [{ path: 'dashboard', label: 'Overview' }, { path: 'clinics', label: 'All clinics' }, { path: 'patients', label: 'Patients' }, { path: 'doctors', label: 'Doctors' }, { path: 'pending', label: 'Pending review' }],
  CLINIC_ADMIN: [
    { path: 'dashboard', label: 'Overview' }, { path: 'profile', label: 'Clinic setup' }, { path: 'doctors', label: 'Doctor invitations' },
    { path: 'review-doctors', label: 'Doctor review' }, { path: 'staff', label: 'Staff invitations' },
  ],
  DOCTOR: [{ path: 'dashboard', label: 'Onboarding' }],
  PATIENT: [{ path: 'dashboard', label: 'Overview' }, { path: 'clinics', label: 'Find a clinic' }, { path: 'profile', label: 'My profile' }],
  STAFF: [{ path: 'dashboard', label: 'Overview' }, { path: 'profile', label: 'My profile' }],
};

export function getPageTitle(role: Role, section: string) {
  if (role === 'DOCTOR') return 'Doctor onboarding';
  if (section === 'review-doctors') return 'Doctor review';
  if (section === 'profile' || section === 'settings') return role === 'CLINIC_ADMIN' ? 'Clinic setup' : 'Your profile';
  if (section === 'pending') return 'Pending clinics';
  if (section === 'clinics') return role === 'PATIENT' ? 'Find a clinic' : 'Clinic directory';
  if (section === 'patients' && role === 'SUPER_ADMIN') return 'Patients';
  if (section === 'doctors' && role === 'SUPER_ADMIN') return 'Doctor directory';
  if (section === 'doctors') return 'Doctor invitations';
  if (section === 'staff') return 'Staff invitations';
  return 'Overview';
}
