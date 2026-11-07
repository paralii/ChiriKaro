import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IGetDoctorVerificationDetailsUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorVerificationDetailsUseCase.ts";
import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";
import { toDoctorOnboardingDTO } from "@application/mappers/doctor-onboarding.mapper.ts";

export class GetDoctorVerificationDetailsUseCase implements IGetDoctorVerificationDetailsUseCase {
  constructor(private readonly doctorRepository: IDoctorRepository) {}

  async execute(doctorId: string, clinicId: string): Promise<DoctorOnboardingDTO> {
    if (!/^[a-f\d]{24}$/i.test(doctorId) || !/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Doctor or clinic id is invalid");
    const doctor = await this.doctorRepository.findByIdAndClinic(doctorId, clinicId);
    if (!doctor) throw new NotFoundError("Doctor verification profile");
    return toDoctorOnboardingDTO(doctor);
  }
}
