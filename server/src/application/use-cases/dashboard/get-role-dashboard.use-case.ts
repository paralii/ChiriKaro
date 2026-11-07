import { Role } from "@domain/value-objects/Role.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IGetRoleDashboardUseCase } from "@application/interfaces/use-cases/dashboard/IGetRoleDashboardUseCase.ts";
import type { RoleDashboardDTO } from "@application/dto/dashboard/role-dashboard.dto.ts";
import { ForbiddenError, NotFoundError } from "@shared/errors/index.ts";

const DASHBOARD_ROLES: Role[] = [Role.PATIENT, Role.DOCTOR, Role.STAFF];

export class GetRoleDashboardUseCase implements IGetRoleDashboardUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _clinicRepository: IClinicRepository,
  ) {}

  async execute(userId: string): Promise<RoleDashboardDTO> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    if (!DASHBOARD_ROLES.includes(user.role)) {
      throw new ForbiddenError("This role does not have a role-specific dashboard");
    }

    let clinic: RoleDashboardDTO["clinic"] = null;
    if (user.clinicId) {
      const clinicEntity = await this._clinicRepository.findById(user.clinicId);
      if (!clinicEntity) throw new NotFoundError("Clinic");
      clinic = {
        id: clinicEntity.id!,
        name: clinicEntity.name,
        status: clinicEntity.status,
      };
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        clinicId: user.clinicId,
      },
      clinic,
    };
  }
}
