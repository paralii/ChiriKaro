import type { NextFunction, Request, Response } from "express";
import { BadRequestError } from "@shared/errors/index.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import type { AIAssistanceUseCase } from "@application/use-cases/consultation/ai-assistance.use-case.ts";

export class AIAssistanceController {
  constructor(private readonly useCase: AIAssistanceUseCase) {}
  symptomAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try { if (!req.user?.clinicId || !req.user.sub || typeof req.params.consultationId !== "string") throw new BadRequestError("Consultation is required"); ApiResponse.success(res, "AI symptom suggestions generated", await this.useCase.symptomAnalysis(req.params.consultationId, req.user.clinicId, req.user.sub, req.body?.consultationData)); } catch (error) { next(error); }
  };
  patientBrief = async (req: Request, res: Response, next: NextFunction) => {
    try { if (!req.user?.clinicId || !req.user.sub || typeof req.params.consultationId !== "string") throw new BadRequestError("Consultation is required"); ApiResponse.success(res, "AI patient brief generated", await this.useCase.patientBrief(req.params.consultationId, req.user.clinicId, req.user.sub)); } catch (error) { next(error); }
  };
  insights = async (req: Request, res: Response, next: NextFunction) => {
    try { if (!req.user?.clinicId || !req.user.sub || typeof req.params.consultationId !== "string") throw new BadRequestError("Consultation is required"); ApiResponse.success(res, "AI patient insights generated", await this.useCase.insights(req.params.consultationId, req.user.clinicId, req.user.sub)); } catch (error) { next(error); }
  };
}
