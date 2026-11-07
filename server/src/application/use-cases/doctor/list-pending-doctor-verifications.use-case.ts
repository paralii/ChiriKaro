import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IListPendingDoctorVerificationsUseCase } from "@application/interfaces/use-cases/doctor/IListPendingDoctorVerificationsUseCase.ts";
import type { DoctorVerificationSummaryDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { BadRequestError } from "@shared/errors/index.ts";
import { toDoctorVerificationSummaryDTO } from "@application/mappers/doctor-onboarding.mapper.ts";

export class ListPendingDoctorVerificationsUseCase implements IListPendingDoctorVerificationsUseCase {
  constructor(private readonly doctorRepository: IDoctorRepository) {}

  async execute(clinicId: string): Promise<DoctorVerificationSummaryDTO[]> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Clinic id is invalid");
    const doctors = await this.doctorRepository.findByClinicAndStatus(clinicId, "PENDING_VERIFICATION");
    return doctors.map(toDoctorVerificationSummaryDTO);
  }
}
