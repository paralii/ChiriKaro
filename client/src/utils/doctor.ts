import { defaultHours } from '@/constants/schedule';
import type { DoctorProfile, WorkingHour } from '@/types';

export const emptyDoctorProfile: DoctorProfile = {
  firstName: '', lastName: '', phone: '', gender: '', dateOfBirth: '', professionalTitle: '', qualification: '',
  yearsOfExperience: null, registrationNumber: '', registrationAuthority: '', bio: '', specializations: [],
  procedures: [], workingHours: defaultHours, consultationFee: null, slotDuration: 30, bufferMinutes: 10,
  verificationStatus: 'NOT_STARTED', onboardingProgress: 0, documents: [], rejectionReason: null,
};

export function findResumeStep(p: DoctorProfile): number {
  if (p.verificationStatus === 'PENDING_VERIFICATION' || p.verificationStatus === 'VERIFIED') return 4;
  if (!p.firstName || !p.lastName || !p.phone || !p.professionalTitle || !p.qualification || !p.registrationNumber || !p.specializations.length || !p.procedures.length) return 0;
  if (p.documents.length < 3) return 1;
  if (!p.workingHours.some((h) => h.isOpen)) return 2;
  return 3;
}

export const findInvalidHours = (hours: WorkingHour[]) => hours.find((h) => h.isOpen && h.startTime >= h.endTime);
export const parseList = (value: string) => [...new Set(value.split(',').map((i) => i.trim()).filter(Boolean))];