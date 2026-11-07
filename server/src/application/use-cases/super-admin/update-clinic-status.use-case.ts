import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IUpdateClinicStatusUseCase } from "@application/interfaces/use-cases/super-admin/IUpdateClinicStatusUseCase.ts";
import type {
  ClinicSummaryDTO,
  UpdateClinicStatusDTO,
} from "@application/dto/super-admin/clinic-management.dto.ts";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@shared/errors/index.ts";
import { toClinicSummaryDTO } from "@application/mappers/clinic-summary.mapper.ts";

const ALLOWED_TRANSITIONS: Record<ClinicStatus, ClinicStatus[]> = {
  [ClinicStatus.PENDING]: [ClinicStatus.APPROVED, ClinicStatus.REJECTED],
  [ClinicStatus.APPROVED]: [ClinicStatus.BLOCKED],
  [ClinicStatus.REJECTED]: [ClinicStatus.PENDING],
  [ClinicStatus.BLOCKED]: [ClinicStatus.APPROVED],
};

export class UpdateClinicStatusUseCase implements IUpdateClinicStatusUseCase {
  constructor(private readonly clinicRepository: IClinicRepository) {}

  async execute(dto: UpdateClinicStatusDTO): Promise<ClinicSummaryDTO> {
    if (!/^[a-f\d]{24}$/i.test(dto.clinicId)) {
      throw new BadRequestError("Clinic id is invalid");
    }
    if (typeof dto.status !== "string" || !Object.values(ClinicStatus).includes(dto.status as ClinicStatus)) {
      throw new ValidationError("Invalid clinic status");
    }
    const status = dto.status as ClinicStatus;

    const clinic = await this.clinicRepository.findById(dto.clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    if (!ALLOWED_TRANSITIONS[clinic.status].includes(status)) {
      throw new ConflictError(`Clinic cannot transition from ${clinic.status} to ${status}`);
    }

    switch (status) {
      case ClinicStatus.APPROVED:
        clinic.approve();
        break;
      case ClinicStatus.REJECTED:
        clinic.reject();
        break;
      case ClinicStatus.BLOCKED:
        clinic.block();
        break;
      case ClinicStatus.PENDING:
        clinic.markPending();
        break;
    }

    return toClinicSummaryDTO(await this.clinicRepository.save(clinic));
  }
}
