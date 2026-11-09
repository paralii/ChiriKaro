import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import type { IUpdatePatientProfileUseCase } from "@application/interfaces/use-cases/patient/IUpdatePatientProfileUseCase.ts";

export class PatientProfileController {
  constructor(private readonly _updatePatientProfileUseCase: IUpdatePatientProfileUseCase) {}

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await this._updatePatientProfileUseCase.execute({
        ...(req.body ?? {}),
        userId: req.user!.sub,
      });
      res.status(HttpStatus.OK).json(
        ApiResponse.success("Patient profile updated successfully", profile),
      );
    } catch (error) {
      next(error);
    }
  };
}
