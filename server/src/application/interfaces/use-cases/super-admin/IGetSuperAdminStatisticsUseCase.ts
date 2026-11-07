import type { SuperAdminStatisticsDTO } from "@application/dto/super-admin/statistics.dto.ts";

export interface IGetSuperAdminStatisticsUseCase {
  execute(): Promise<SuperAdminStatisticsDTO>;
}
