import type { Doctor } from "@domain/entities/doctor.entity.ts";
import type { DoctorAvailabilityDTO, DoctorAvailabilitySlotsDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export function toDoctorAvailabilityDTO(doctor: Doctor): DoctorAvailabilityDTO {
  return {
    doctorId: doctor.id!,
    workingHours: doctor.workingHours,
    breaks: doctor.breaks,
    slotDurationMinutes: doctor.slotDurationMinutes,
    bufferTimeMinutes: doctor.bufferTimeMinutes,
    updatedAt: doctor.updatedAt,
  };
}

export function toDoctorAvailabilitySlotsDTO(doctor: Doctor): DoctorAvailabilitySlotsDTO {
  return { doctorId: doctor.id!, slots: doctor.generateAvailabilitySlots() };
}
