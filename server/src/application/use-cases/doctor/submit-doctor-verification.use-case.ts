import { DomainError } from "@domain/error/DomainError.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { ISubmitDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/ISubmitDoctorVerificationUseCase.ts";
import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toDoctorOnboardingDTO } from "@application/mappers/doctor-onboarding.mapper.ts";

export class SubmitDoctorVerificationUseCase implements ISubmitDoctorVerificationUseCase {
  constructor(private readonly doctorRepository: IDoctorRepository) {}

  async execute(userId: string, clinicId: string): Promise<DoctorOnboardingDTO> {
    if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Doctor or clinic id is invalid");
    const doctor = await this.doctorRepository.findByUserId(userId);
    if (!doctor) throw new NotFoundError("Doctor onboarding profile");
    if (doctor.clinicId !== clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");
    try { doctor.submitForVerification(); }
    catch (error) { if (error instanceof DomainError) throw new ValidationError(error.message); throw error; }
    return toDoctorOnboardingDTO(await this.doctorRepository.save(doctor));
  }
}
