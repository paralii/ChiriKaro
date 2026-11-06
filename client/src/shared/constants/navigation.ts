import type { Role } from '@/store/slices/authSlice';

export type NavEntry = { path: string; label: string };

export const navItems: Record<Role, NavEntry[]> = {
  super_admin: [{ path: 'dashboard', label: 'Overview' }, { path: 'clinics', label: 'All clinics' }, { path: 'pending', label: 'Pending review' }],
  clinic_admin: [
    { path: 'dashboard', label: 'Overview' }, { path: 'profile', label: 'Clinic setup' }, { path: 'doctors', label: 'Doctor invitations' },
    { path: 'review-doctors', label: 'Doctor review' }, { path: 'staff', label: 'Staff invitations' },
  ],
  doctor: [{ path: 'dashboard', label: 'Onboarding' }],
  patient: [{ path: 'dashboard', label: 'Overview' }, { path: 'clinics', label: 'Find a clinic' }, { path: 'profile', label: 'My profile' }],
  staff: [{ path: 'dashboard', label: 'Overview' }, { path: 'profile', label: 'My profile' }],
};

export function getPageTitle(role: Role, section: string) {
  if (role === 'doctor') return 'Doctor onboarding';
  if (section === 'review-doctors') return 'Doctor review';
  if (section === 'profile' || section === 'settings') return role === 'clinic_admin' ? 'Clinic setup' : 'Your profile';
  if (section === 'pending') return 'Pending clinics';
  if (section === 'clinics') return role === 'patient' ? 'Find a clinic' : 'Clinic directory';
  if (section === 'doctors') return 'Doctor invitations';
  if (section === 'staff') return 'Staff invitations';
  return 'Overview';
}