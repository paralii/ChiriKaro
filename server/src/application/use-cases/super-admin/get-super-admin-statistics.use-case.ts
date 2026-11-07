import type { ISuperAdminStatisticsRepository } from "@application/interfaces/repositories/ISuperAdminStatisticsRepository.ts";
import type { IGetSuperAdminStatisticsUseCase } from "@application/interfaces/use-cases/super-admin/IGetSuperAdminStatisticsUseCase.ts";
import type { SuperAdminStatisticsDTO } from "@application/dto/super-admin/statistics.dto.ts";

export class GetSuperAdminStatisticsUseCase implements IGetSuperAdminStatisticsUseCase {
  constructor(private readonly statisticsRepository: ISuperAdminStatisticsRepository) {}

  execute(): Promise<SuperAdminStatisticsDTO> {
    return this.statisticsRepository.getStatistics();
  }
}
