import type { Doctor } from "@domain/entities/doctor.entity.ts";
import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";

export function toDoctorOnboardingDTO(doctor: Doctor | null): DoctorOnboardingDTO {
  if (!doctor) return { onboardingStatus: "NOT_STARTED", profile: null };
  return {
    onboardingStatus: doctor.verificationStatus,
    profile: {
      id: doctor.id!,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      gender: doctor.gender,
      dateOfBirth: doctor.dateOfBirth,
      professionalTitle: doctor.professionalTitle,
      qualifications: doctor.qualifications,
      yearsOfExperience: doctor.yearsOfExperience,
      registrationNumber: doctor.registrationNumber,
      registrationAuthority: doctor.registrationAuthority,
      specializations: doctor.specializations,
      procedures: doctor.procedures,
      workingHours: doctor.workingHours,
      documents: doctor.documents.map(({ documentType, status, uploadedAt, verifiedAt, rejectionReason }) => ({
        documentType,
        status,
        uploadedAt,
        verifiedAt,
        rejectionReason,
      })),
      onboardingStatus: doctor.verificationStatus,
      rejectionReason: doctor.rejectionReason,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    },
  };
}

export function toDoctorVerificationSummaryDTO(doctor: Doctor) {
  return {
    doctorId: doctor.id!,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    professionalTitle: doctor.professionalTitle,
    verificationStatus: doctor.verificationStatus,
    updatedAt: doctor.updatedAt,
  };
}
