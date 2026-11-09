import type { DoctorAvailabilitySlot, DoctorBreak, DoctorDayOfWeek, DoctorOnboardingProfile, WorkingHour } from '@/shared/types';

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
  const rows = Array.isArray(profileHours) ? profileHours : [];
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
    const canonical = day.toUpperCase() as DoctorDayOfWeek;
    const hour = rows.find((row) => String(row?.day ?? '').trim().toUpperCase() === canonical);
    return {
      day,
      isOpen: Boolean(hour?.isOpen),
      startTime: hour?.startTime ?? '09:00',
      endTime: hour?.endTime ?? '17:00',
    };
  });
}

export function hasCompleteDoctorHours(profileHours: DoctorOnboardingProfile['workingHours']): boolean {
  if (!Array.isArray(profileHours) || profileHours.length !== 7) return false;
  const expectedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const storedDays = new Set(profileHours.map((hour) => String(hour?.day ?? '').trim().toUpperCase()));
  if (storedDays.size !== 7 || expectedDays.some((day) => !storedDays.has(day))) return false;
  const displayHours = toDisplayWorkingHours(profileHours);
  return displayHours.some((hour) => hour.isOpen) && !findInvalidHours(displayHours);
}

export function findResumeStep(profile: DoctorOnboardingProfile): number {
  if (!profile.firstName || !profile.lastName) return 0;
  if (!profile.professionalTitle || !profile.qualifications?.length || profile.yearsOfExperience === null || !profile.registrationNumber || !profile.registrationAuthority) return 1;
  if (!profile.specializations?.length || !profile.procedures?.length) return 2;
  if (!profile.documents?.some((document) => document && typeof document.documentType === 'string' && document.documentType.trim())) return 4;
  return 5;
}

export function parseList(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

export function findInvalidHours(hours: WorkingHour[]): WorkingHour | undefined {
  return hours.find((hour) => hour.isOpen && (!hour.startTime || !hour.endTime || hour.startTime >= hour.endTime));
}

export function findClinicHoursConflict(doctorHours: WorkingHour[], clinicHours: WorkingHour[]): WorkingHour | undefined {
  return doctorHours.find((hour) => {
    if (!hour.isOpen) return false;
    const clinicHour = clinicHours.find((item) => item.day.toUpperCase() === hour.day.toUpperCase());
    return !clinicHour?.isOpen || hour.startTime < clinicHour.startTime || hour.endTime > clinicHour.endTime;
  });
}

export function getDoctorBreakError(breaks: DoctorBreak[], hours: WorkingHour[]): string | undefined {
  for (const pause of breaks) {
    const day = `${pause.day[0]}${pause.day.slice(1).toLowerCase()}`;
    const dayHours = hours.find((hour) => hour.day.toUpperCase() === pause.day && hour.isOpen);
    if (!dayHours) return `${day}: a break requires an open working day.`;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(pause.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(pause.endTime) || pause.startTime >= pause.endTime) {
      return `${day}: enter a valid break time range.`;
    }
    if (pause.startTime < dayHours.startTime || pause.endTime > dayHours.endTime) return `${day}: the break must fit within working hours.`;
  }

  const ordered = [...breaks].sort((a, b) => a.day.localeCompare(b.day) || a.startTime.localeCompare(b.startTime));
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!;
    const current = ordered[index]!;
    if (previous.day === current.day && previous.endTime > current.startTime) {
      return `${current.day[0]}${current.day.slice(1).toLowerCase()}: breaks must not overlap.`;
    }
  }
  return undefined;
}

export function sortAvailabilitySlots(slots: DoctorAvailabilitySlot[]): DoctorAvailabilitySlot[] {
  const order: DoctorDayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  return [...slots].sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day) || a.startTime.localeCompare(b.startTime));
}
