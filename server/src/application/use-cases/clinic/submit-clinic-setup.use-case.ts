import { DomainError } from "@domain/error/DomainError.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { ISubmitClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/ISubmitClinicSetupUseCase.ts";
import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toClinicProfileDTO } from "@application/mappers/clinic-profile.mapper.ts";

export class SubmitClinicSetupUseCase implements ISubmitClinicSetupUseCase {
  constructor(private readonly _clinicRepository: IClinicRepository) {}

  async execute(clinicId: string): Promise<ClinicProfileDTO> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Clinic id is invalid");
    const clinic = await this._clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    try { clinic.submitSetup(); }
    catch (error) { if (error instanceof DomainError) throw new ValidationError(error.message); throw error; }
    return toClinicProfileDTO(await this._clinicRepository.save(clinic));
  }
}
