import type { AnalyticsDTO, AnalyticsRequest, AnalyticsScope } from "@application/dto/dashboard/analytics.dto.ts";
export interface IGetAnalyticsUseCase { execute(scope: AnalyticsScope, request: AnalyticsRequest): Promise<AnalyticsDTO>; }
