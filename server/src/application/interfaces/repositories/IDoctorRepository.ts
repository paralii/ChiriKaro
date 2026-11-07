import type { Doctor } from "@domain/entities/doctor.entity.ts";

export interface IDoctorRepository {
  findByUserId(userId: string): Promise<Doctor | null>;
  save(doctor: Doctor): Promise<Doctor>;
}
