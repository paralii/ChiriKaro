import type {
  DoctorDayOfWeek,
  DoctorGender,
  DoctorVerificationStatus,
} from "@domain/entities/doctor.entity.ts";

export type DoctorOnboardingStep = "basic" | "professional" | "practice";

export interface DoctorOnboardingProfileDTO {
  id: string;
  firstName: string;
  lastName: string;
  gender: DoctorGender | null;
  dateOfBirth: Date | null;
  professionalTitle: string | null;
  qualifications: string[];
  yearsOfExperience: number | null;
  registrationNumber: string | null;
  registrationAuthority: string | null;
  specializations: string[];
  procedures: string[];
  workingHours: Array<{
    day: DoctorDayOfWeek;
    isOpen: boolean;
    startTime: string;
    endTime: string;
  }>;
  documents: Array<{ documentType: string; status: string; uploadedAt: Date }>;
  onboardingStatus: DoctorVerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorOnboardingDTO {
  onboardingStatus: DoctorVerificationStatus | "NOT_STARTED";
  profile: DoctorOnboardingProfileDTO | null;
}

export interface UpdateDoctorOnboardingDTO {
  userId: string;
  clinicId: string;
  step: DoctorOnboardingStep;
  updates: unknown;
}
