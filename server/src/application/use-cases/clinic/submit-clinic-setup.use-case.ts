import { DomainError } from "@domain/error/DomainError.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { ClinicSetupStatus } from "@domain/enum/clinic-setup-status.enum.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { ISubmitClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/ISubmitClinicSetupUseCase.ts";
import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";
import { BadRequestError, ConflictError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toClinicProfileDTO } from "@application/mappers/clinic-profile.mapper.ts";

export class SubmitClinicSetupUseCase implements ISubmitClinicSetupUseCase {
  constructor(private readonly _clinicRepository: IClinicRepository) {}

  async execute(clinicId: string): Promise<ClinicProfileDTO> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Clinic id is invalid");
    const clinic = await this._clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    const initialSubmission = clinic.setupStatus === ClinicSetupStatus.IN_PROGRESS && clinic.status === ClinicStatus.PENDING;
    const resubmission = clinic.setupStatus === ClinicSetupStatus.REJECTED && [ClinicStatus.REJECTED, ClinicStatus.PENDING].includes(clinic.status);
    if (!initialSubmission && !resubmission) throw new ConflictError("Clinic setup cannot be submitted in its current status");
    try { clinic.submitSetup(); }
    catch (error) { if (error instanceof DomainError) throw new ValidationError(error.message); throw error; }
    return toClinicProfileDTO(await this._clinicRepository.save(clinic));
  }
}
