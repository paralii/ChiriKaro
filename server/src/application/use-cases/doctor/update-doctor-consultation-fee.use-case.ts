import { DomainError } from "@domain/error/DomainError.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IUpdateDoctorConsultationFeeUseCase } from "@application/interfaces/use-cases/doctor/IUpdateDoctorConsultationFeeUseCase.ts";
import type { DoctorConsultationFeeDTO, UpdateDoctorConsultationFeeDTO } from "@application/dto/doctor/doctor-consultation-fee.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toDoctorConsultationFeeDTO } from "@application/mappers/doctor-consultation-fee.mapper.ts";

export class UpdateDoctorConsultationFeeUseCase implements IUpdateDoctorConsultationFeeUseCase {
  constructor(private readonly doctorRepository: IDoctorRepository) {}

  async execute(dto: UpdateDoctorConsultationFeeDTO): Promise<DoctorConsultationFeeDTO> {
    if (!/^[a-f\d]{24}$/i.test(dto.doctorId) || !/^[a-f\d]{24}$/i.test(dto.clinicId)) {
      throw new BadRequestError("Doctor or clinic id is invalid");
    }
    if (typeof dto.consultationFee !== "number" || !Number.isFinite(dto.consultationFee)) {
      throw new ValidationError("consultationFee must be a valid number");
    }
    const doctor = await this.doctorRepository.findByIdAndClinic(dto.doctorId, dto.clinicId);
    if (!doctor) throw new NotFoundError("Doctor profile");
    try {
      doctor.updateConsultationFee(dto.consultationFee);
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
    return toDoctorConsultationFeeDTO(await this.doctorRepository.save(doctor));
  }
}
