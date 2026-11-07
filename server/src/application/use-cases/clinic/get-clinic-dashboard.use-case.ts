import { Role } from "@domain/value-objects/Role.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IGetClinicDashboardUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDashboardUseCase.ts";
import type { ClinicDashboardDTO } from "@application/dto/clinic/clinic-dashboard.dto.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";
import { toClinicProfileDTO } from "@application/mappers/clinic-profile.mapper.ts";

export class GetClinicDashboardUseCase implements IGetClinicDashboardUseCase {
  constructor(
    private readonly _clinicRepository: IClinicRepository,
    private readonly _userRepository: IUserRepository,
  ) {}

  async execute(clinicId: string): Promise<ClinicDashboardDTO> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Clinic id is invalid");
    }
    const [clinic, members] = await Promise.all([
      this._clinicRepository.findById(clinicId),
      this._userRepository.findByClinic(clinicId),
    ]);
    if (!clinic) throw new NotFoundError("Clinic");

    const totalDoctors = members.filter((member) => member.role === Role.DOCTOR).length;
    const totalStaff = members.filter((member) => member.role === Role.STAFF).length;
    return {
      clinic: toClinicProfileDTO(clinic),
      totalDoctors,
      totalStaff,
      totalTeamMembers: totalDoctors + totalStaff,
    };
  }
}
