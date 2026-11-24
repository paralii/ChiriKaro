import type { AnalyticsDTO, AnalyticsRequest, AnalyticsScope } from "@application/dto/dashboard/analytics.dto.ts";
export interface IAnalyticsRepository { getAnalytics(scope: AnalyticsScope, request: AnalyticsRequest): Promise<AnalyticsDTO>; }
