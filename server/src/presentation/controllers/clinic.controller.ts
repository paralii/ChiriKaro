import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";

import type { IRegisterClinicUseCase } from "@application/interfaces/use-cases/clinic/IRegisterClinicUseCase.ts";
import type { IGetClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicProfileUseCase.ts";
import type { IUpdateClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicProfileUseCase.ts";
import type { IGetClinicDashboardUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDashboardUseCase.ts";

export class ClinicController {
  constructor(
    private readonly _registerClinicUseCase: IRegisterClinicUseCase,
    private readonly _getClinicProfileUseCase: IGetClinicProfileUseCase,
    private readonly _updateClinicProfileUseCase: IUpdateClinicProfileUseCase,
    private readonly _getClinicDashboardUseCase: IGetClinicDashboardUseCase,
  ) {}

  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { message, ...data } = await this._registerClinicUseCase.execute(
        req.body,
      );

      res.status(HttpStatus.CREATED).json(ApiResponse.created(message, data));
    } catch (error) {
      next(error);
    }
  };

  public getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._getClinicProfileUseCase.execute(
        req.user!.clinicId!,
      );
      res.status(HttpStatus.OK).json(ApiResponse.success("Clinic profile retrieved", result));
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._updateClinicProfileUseCase.execute({
        clinicId: req.user!.clinicId!,
        updates: req.body,
      });
      res.status(HttpStatus.OK).json(ApiResponse.success("Clinic profile updated", result));
    } catch (error) {
      next(error);
    }
  };

  public getDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._getClinicDashboardUseCase.execute(
        req.user!.clinicId!,
      );
      res.status(HttpStatus.OK).json(ApiResponse.success("Clinic dashboard retrieved", result));
    } catch (error) {
      next(error);
    }
  };
}
