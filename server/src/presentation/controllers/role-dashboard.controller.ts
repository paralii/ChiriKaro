import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import type { IGetRoleDashboardUseCase } from "@application/interfaces/use-cases/dashboard/IGetRoleDashboardUseCase.ts";

export class RoleDashboardController {
  constructor(private readonly _getRoleDashboardUseCase: IGetRoleDashboardUseCase) {}

  getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dashboard = await this._getRoleDashboardUseCase.execute(req.user!.sub);
      res.status(HttpStatus.OK).json(
        ApiResponse.success("Dashboard retrieved successfully", dashboard),
      );
    } catch (error) {
      next(error);
    }
  };
}
