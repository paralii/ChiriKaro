import type { DoctorVerificationStatus } from "@domain/entities/doctor.entity.ts";

export interface ClinicDoctorSpecializationDTO {
  doctorId: string;
  firstName: string;
  lastName: string;
  verificationStatus: DoctorVerificationStatus;
  specializations: string[];
}

export interface UpdateClinicDoctorSpecializationsDTO {
  clinicId: string;
  doctorId: string;
  specializations: unknown;
}
