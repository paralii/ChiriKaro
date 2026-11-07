import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IGetClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicProfileUseCase.ts";
import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";
import { toClinicProfileDTO } from "@application/mappers/clinic-profile.mapper.ts";

export class GetClinicProfileUseCase implements IGetClinicProfileUseCase {
  constructor(private readonly _clinicRepository: IClinicRepository) {}

  async execute(clinicId: string): Promise<ClinicProfileDTO> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Clinic id is invalid");
    }
    const clinic = await this._clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    return toClinicProfileDTO(clinic);
  }
}
