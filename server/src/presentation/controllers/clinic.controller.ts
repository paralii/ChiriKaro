import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";

import type { IRegisterClinicUseCase } from "@application/interfaces/use-cases/clinic/IRegisterClinicUseCase.ts";

export class ClinicController {
  constructor(
    private readonly _registerClinicUseCase: IRegisterClinicUseCase,
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
}
