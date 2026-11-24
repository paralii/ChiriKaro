import type { NextFunction, Request, Response } from "express";
import { Role } from "@domain/value-objects/Role.ts";
import type { AnalyticsRange, AnalyticsScope } from "@application/dto/dashboard/analytics.dto.ts";
import type { IGetAnalyticsUseCase } from "@application/interfaces/use-cases/dashboard/IGetAnalyticsUseCase.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { ValidationError, ForbiddenError } from "@shared/errors/index.ts";

export class AnalyticsController {
  constructor(private readonly useCase: IGetAnalyticsUseCase) {}
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = req.user!.role;
      const range = (typeof req.query.range === "string" ? req.query.range : "30d") as AnalyticsRange;
      if (!["7d", "30d", "90d", "all"].includes(range)) throw new ValidationError("Range must be 7d, 30d, 90d, or all");
      let scope: AnalyticsScope;
      if (role === Role.SUPER_ADMIN) scope = { role };
      else if (role === Role.CLINIC_ADMIN && req.user!.clinicId) scope = { role, clinicId: req.user!.clinicId };
      else if (role === Role.DOCTOR && req.user!.clinicId) scope = { role, clinicId: req.user!.clinicId, doctorUserId: req.user!.sub };
      else throw new ForbiddenError("Analytics are not available for this role");
      ApiResponse.success(res, "Analytics retrieved", await this.useCase.execute(scope, { range }));
    } catch (error) { next(error); }
  };
}
