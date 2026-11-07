import type { DoctorDayOfWeek, DoctorOnboardingProfile, WorkingHour } from '@/shared/types';

const weekdays: Record<string, DoctorDayOfWeek> = {
  Monday: 'MONDAY', Tuesday: 'TUESDAY', Wednesday: 'WEDNESDAY', Thursday: 'THURSDAY',
  Friday: 'FRIDAY', Saturday: 'SATURDAY', Sunday: 'SUNDAY',
};

export const emptyDoctorOnboardingProfile: DoctorOnboardingProfile = {
  id: '', firstName: '', lastName: '', gender: null, dateOfBirth: null, professionalTitle: null,
  qualifications: [], yearsOfExperience: null, registrationNumber: null, registrationAuthority: null,
  specializations: [], procedures: [], workingHours: [], documents: [], onboardingStatus: 'NOT_STARTED', rejectionReason: null,
};

export function toDoctorWorkingHours(hours: WorkingHour[]) {
  return hours.map((hour) => ({ ...hour, day: weekdays[hour.day] ?? (hour.day.toUpperCase() as DoctorDayOfWeek) }));
}

export function toDisplayWorkingHours(profileHours: DoctorOnboardingProfile['workingHours']): WorkingHour[] {
  return profileHours.map((hour) => ({ ...hour, day: `${hour.day[0]}${hour.day.slice(1).toLowerCase()}` }));
}

export function findResumeStep(profile: DoctorOnboardingProfile): number {
  if (!profile.firstName || !profile.lastName) return 0;
  if (!profile.professionalTitle || !profile.qualifications.length || profile.yearsOfExperience === null || !profile.registrationNumber || !profile.registrationAuthority) return 1;
  if (!profile.specializations.length || !profile.procedures.length || profile.workingHours.length !== 7) return 2;
  if (!profile.documents.length) return 3;
  return 4;
}

export function parseList(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

export function findInvalidHours(hours: WorkingHour[]): WorkingHour | undefined {
  return hours.find((hour) => hour.isOpen && (!hour.startTime || !hour.endTime || hour.startTime >= hour.endTime));
}
