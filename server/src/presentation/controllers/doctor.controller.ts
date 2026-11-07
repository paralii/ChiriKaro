import type { Request, Response, NextFunction } from "express";
import type { IGetDoctorOnboardingUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorOnboardingUseCase.ts";
import type { IUpdateDoctorOnboardingUseCase } from "@application/interfaces/use-cases/doctor/IUpdateDoctorOnboardingUseCase.ts";
import type { IUploadDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IUploadDoctorDocumentUseCase.ts";
import type { IGetDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorDocumentUseCase.ts";
import type { DoctorOnboardingStep } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { ValidationError } from "@shared/errors/index.ts";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";

export class DoctorController {
  constructor(
    private readonly _getOnboardingUseCase: IGetDoctorOnboardingUseCase,
    private readonly _updateOnboardingUseCase: IUpdateDoctorOnboardingUseCase,
    private readonly _uploadDocumentUseCase: IUploadDoctorDocumentUseCase,
    private readonly _getDocumentUseCase: IGetDoctorDocumentUseCase,
  ) {}

  getOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._getOnboardingUseCase.execute(req.user!.sub, req.user!.clinicId!);
      res.status(HttpStatus.OK).json(ApiResponse.success("Doctor onboarding retrieved", result));
    } catch (error) { next(error); }
  };

  updateOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const step = req.params.step;
      if (typeof step !== "string" || !["basic", "professional", "practice"].includes(step)) {
        throw new ValidationError("Onboarding step must be basic, professional, or practice");
      }
      const result = await this._updateOnboardingUseCase.execute({
        userId: req.user!.sub,
        clinicId: req.user!.clinicId!,
        step: step as DoctorOnboardingStep,
        updates: req.body,
      });
      res.status(HttpStatus.OK).json(ApiResponse.success("Doctor onboarding step saved", result));
    } catch (error) { next(error); }
  };

  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!Buffer.isBuffer(req.body)) throw new ValidationError("Upload the document as a raw PDF, JPEG, or PNG body");
      const documentType = req.query.documentType;
      if (typeof documentType !== "string") throw new ValidationError("Document type is required");
      const result = await this._uploadDocumentUseCase.execute(
        req.user!.sub,
        req.user!.clinicId!,
        documentType,
        req.body,
        req.header("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "",
      );
      res.status(HttpStatus.CREATED).json(ApiResponse.created("Doctor document uploaded", result));
    } catch (error) { next(error); }
  };

  getDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const documentType = req.params.documentType;
      if (typeof documentType !== "string") throw new ValidationError("Document type is required");
      const result = await this._getDocumentUseCase.execute(req.user!.sub, documentType);
      res.status(HttpStatus.OK).type(result.contentType).send(result.content);
    } catch (error) { next(error); }
  };
}
