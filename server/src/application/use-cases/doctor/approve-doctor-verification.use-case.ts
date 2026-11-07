import { DomainError } from "@domain/error/DomainError.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IApproveDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/IApproveDoctorVerificationUseCase.ts";
import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toDoctorOnboardingDTO } from "@application/mappers/doctor-onboarding.mapper.ts";

export class ApproveDoctorVerificationUseCase implements IApproveDoctorVerificationUseCase {
  constructor(private readonly doctorRepository: IDoctorRepository) {}

  async execute(doctorId: string, clinicId: string): Promise<DoctorOnboardingDTO> {
    if (!/^[a-f\d]{24}$/i.test(doctorId) || !/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Doctor or clinic id is invalid");
    const doctor = await this.doctorRepository.findByIdAndClinic(doctorId, clinicId);
    if (!doctor) throw new NotFoundError("Doctor verification profile");
    try { doctor.approveVerification(); }
    catch (error) { if (error instanceof DomainError) throw new ValidationError(error.message); throw error; }
    return toDoctorOnboardingDTO(await this.doctorRepository.save(doctor));
  }
}
