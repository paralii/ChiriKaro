import type { Doctor } from "@domain/entities/doctor.entity.ts";
import type { DoctorConsultationFeeDTO } from "@application/dto/doctor/doctor-consultation-fee.dto.ts";

export function toDoctorConsultationFeeDTO(doctor: Doctor): DoctorConsultationFeeDTO {
  return {
    doctorId: doctor.id!,
    consultationFee: doctor.consultationFee,
    updatedAt: doctor.updatedAt,
  };
}
