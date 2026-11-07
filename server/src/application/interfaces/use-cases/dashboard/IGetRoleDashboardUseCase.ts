import type { RoleDashboardDTO } from "@application/dto/dashboard/role-dashboard.dto.ts";

export interface IGetRoleDashboardUseCase {
  execute(userId: string): Promise<RoleDashboardDTO>;
}
