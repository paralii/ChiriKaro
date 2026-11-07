import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IGetDoctorAvailabilityUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorAvailabilityUseCase.ts";
import type { DoctorAvailabilityDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";
import { toDoctorAvailabilityDTO } from "@application/mappers/doctor-availability.mapper.ts";

export class GetDoctorAvailabilityUseCase implements IGetDoctorAvailabilityUseCase {
  constructor(private readonly _doctorRepository: IDoctorRepository) {}

  async execute(userId: string, clinicId: string): Promise<DoctorAvailabilityDTO> {
    if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Doctor or clinic id is invalid");
    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) throw new NotFoundError("Doctor profile");
    if (doctor.clinicId !== clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");
    return toDoctorAvailabilityDTO(doctor);
  }
}
