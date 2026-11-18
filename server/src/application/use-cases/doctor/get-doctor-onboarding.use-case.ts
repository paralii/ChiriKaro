import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IGetDoctorOnboardingUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorOnboardingUseCase.ts";
import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { BadRequestError } from "@shared/errors/index.ts";
import { toDoctorOnboardingDTO } from "@application/mappers/doctor-onboarding.mapper.ts";

export class GetDoctorOnboardingUseCase implements IGetDoctorOnboardingUseCase {
  constructor(private readonly _doctorRepository: IDoctorRepository, private readonly _clinicRepository: IClinicRepository) {}

  async execute(userId: string, clinicId: string): Promise<DoctorOnboardingDTO> {
    if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Doctor or clinic id is invalid");
    }
    const [doctor, clinic] = await Promise.all([this._doctorRepository.findByUserId(userId), this._clinicRepository.findById(clinicId)]);
    if (!clinic) throw new BadRequestError("Clinic could not be found");
    if (doctor && doctor.clinicId !== clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");
    return {
      ...toDoctorOnboardingDTO(doctor),
      clinicSpecializations: clinic.specializations,
      clinicWorkingHours: clinic.workingHours,
    };
  }
}
