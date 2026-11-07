import type { Doctor, DoctorVerificationStatus } from "@domain/entities/doctor.entity.ts";

export interface IDoctorRepository {
  findByUserId(userId: string): Promise<Doctor | null>;
  findByIdAndClinic(doctorId: string, clinicId: string): Promise<Doctor | null>;
  findByClinicAndStatus(clinicId: string, status: DoctorVerificationStatus): Promise<Doctor[]>;
  save(doctor: Doctor): Promise<Doctor>;
}
