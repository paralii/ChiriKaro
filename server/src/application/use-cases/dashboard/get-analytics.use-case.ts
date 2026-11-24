import type { AnalyticsDTO, AnalyticsRequest, AnalyticsScope } from "@application/dto/dashboard/analytics.dto.ts";
import type { IAnalyticsRepository } from "@application/interfaces/repositories/IAnalyticsRepository.ts";
import type { IGetAnalyticsUseCase } from "@application/interfaces/use-cases/dashboard/IGetAnalyticsUseCase.ts";
import { ValidationError } from "@shared/errors/index.ts";

export class GetAnalyticsUseCase implements IGetAnalyticsUseCase {
  constructor(private readonly repository: IAnalyticsRepository) {}
  execute(scope: AnalyticsScope, request: AnalyticsRequest): Promise<AnalyticsDTO> {
    if (!["7d", "30d", "90d", "all"].includes(request.range)) throw new ValidationError("Range must be 7d, 30d, 90d, or all");
    return this.repository.getAnalytics(scope, request);
  }
}
