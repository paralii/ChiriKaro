import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IGetDoctorConsultationFeeUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorConsultationFeeUseCase.ts";
import type { DoctorConsultationFeeDTO } from "@application/dto/doctor/doctor-consultation-fee.dto.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";
import { toDoctorConsultationFeeDTO } from "@application/mappers/doctor-consultation-fee.mapper.ts";

export class GetDoctorConsultationFeeUseCase implements IGetDoctorConsultationFeeUseCase {
  constructor(private readonly doctorRepository: IDoctorRepository) {}

  async execute(userId: string, clinicId: string): Promise<DoctorConsultationFeeDTO> {
    if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Doctor or clinic id is invalid");
    }
    const doctor = await this.doctorRepository.findByUserId(userId);
    if (!doctor) throw new NotFoundError("Doctor profile");
    if (doctor.clinicId !== clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");
    return toDoctorConsultationFeeDTO(doctor);
  }
}
