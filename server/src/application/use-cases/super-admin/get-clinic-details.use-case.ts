import type { ISuperAdminClinicRepository } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";
import type { IGetClinicDetailsUseCase } from "@application/interfaces/use-cases/super-admin/IGetClinicDetailsUseCase.ts";
import type { ClinicSummaryDTO } from "@application/dto/super-admin/clinic-management.dto.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";
import { toClinicSummaryDTO } from "@application/mappers/clinic-summary.mapper.ts";

export class GetClinicDetailsUseCase implements IGetClinicDetailsUseCase {
  constructor(private readonly clinicRepository: ISuperAdminClinicRepository) {}

  async execute(clinicId: string): Promise<ClinicSummaryDTO> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Clinic id is invalid");
    }
    const clinic = await this.clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    return toClinicSummaryDTO(clinic);
  }
}
