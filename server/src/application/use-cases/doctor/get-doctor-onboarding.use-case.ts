import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IGetDoctorOnboardingUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorOnboardingUseCase.ts";
import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { BadRequestError } from "@shared/errors/index.ts";
import { toDoctorOnboardingDTO } from "@application/mappers/doctor-onboarding.mapper.ts";

export class GetDoctorOnboardingUseCase implements IGetDoctorOnboardingUseCase {
  constructor(private readonly _doctorRepository: IDoctorRepository) {}

  async execute(userId: string, clinicId: string): Promise<DoctorOnboardingDTO> {
    if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Doctor or clinic id is invalid");
    }
    const doctor = await this._doctorRepository.findByUserId(userId);
    if (doctor && doctor.clinicId !== clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");
    return toDoctorOnboardingDTO(doctor);
  }
}
