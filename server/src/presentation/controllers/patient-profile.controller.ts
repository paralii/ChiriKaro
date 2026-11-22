import type { NextFunction, Request, Response } from "express";
import { MESSAGES } from "@shared/constants/messages.constants.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import type { IUpdatePatientProfileUseCase } from "@application/interfaces/use-cases/patient/IUpdatePatientProfileUseCase.ts";

export class PatientProfileController {
  constructor(
    private readonly _updatePatientProfileUseCase: IUpdatePatientProfileUseCase,
  ) {}

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const profile = await this._updatePatientProfileUseCase.execute({
        ...(req.body ?? {}),
        userId: req.user!.sub,
      });
      ApiResponse.success(res, MESSAGES.response.patientProfileUpdated, profile);
    } catch (error) {
      next(error);
    }
  };
}

