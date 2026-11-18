import type { Clinic } from "@domain/entities/clinic.entity.ts";
import type { Doctor } from "@domain/entities/doctor.entity.ts";

export interface IQueueClinicContext {
  getOperationalClinic(clinicId: string): Promise<Clinic>;
  getVerifiedDoctor(clinicId: string, doctorUserId: string): Promise<Doctor>;
  listVerifiedDoctors(clinicId: string): Promise<Doctor[]>;
  localDate(now: Date, timeZone: string): string;
}
