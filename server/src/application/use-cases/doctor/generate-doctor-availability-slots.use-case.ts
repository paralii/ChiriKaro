import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IGenerateDoctorAvailabilitySlotsUseCase } from "@application/interfaces/use-cases/doctor/IGenerateDoctorAvailabilitySlotsUseCase.ts";
import type { DoctorAvailabilitySlotsDTO } from "@application/dto/doctor/doctor-availability.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toDoctorAvailabilitySlotsDTO } from "@application/mappers/doctor-availability.mapper.ts";

export class GenerateDoctorAvailabilitySlotsUseCase implements IGenerateDoctorAvailabilitySlotsUseCase {
  constructor(private readonly _doctorRepository: IDoctorRepository) {}

  async execute(userId: string, clinicId: string): Promise<DoctorAvailabilitySlotsDTO> {
    if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Doctor or clinic id is invalid");
    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) throw new NotFoundError("Doctor profile");
    if (doctor.clinicId !== clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");
    if (!doctor.workingHours.some((hours) => hours.isOpen)) throw new ValidationError("Configure doctor working hours before generating slots");
    return toDoctorAvailabilitySlotsDTO(doctor);
  }
}
