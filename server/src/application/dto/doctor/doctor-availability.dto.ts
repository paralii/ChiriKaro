import type { DoctorAvailabilitySlot, DoctorBreak, DoctorWorkingHour } from "@domain/entities/doctor.entity.ts";

export interface DoctorAvailabilityDTO {
  doctorId: string;
  workingHours: DoctorWorkingHour[];
  breaks: DoctorBreak[];
  slotDurationMinutes: number;
  bufferTimeMinutes: number;
  updatedAt: Date;
}

export interface ConfigureDoctorAvailabilityInput {
  userId: string;
  clinicId: string;
  updates: unknown;
}

export interface DoctorAvailabilitySlotsDTO {
  doctorId: string;
  slots: DoctorAvailabilitySlot[];
}
