import type { NextFunction, Request, Response } from "express";
import { MESSAGES } from "@shared/constants/messages.constants.ts";
import type { IListPatientQueueUseCase } from "@application/interfaces/use-cases/patient/IListPatientQueueUseCase.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";

export class PatientQueueController {
  constructor(private readonly listQueue: IListPatientQueueUseCase) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      ApiResponse.success(res, MESSAGES.response.patientQueueEntriesRetrieved, await this.listQueue.execute(req.user!.sub));
    } catch (error) { next(error); }
  };
}

