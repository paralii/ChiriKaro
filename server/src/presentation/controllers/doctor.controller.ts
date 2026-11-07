import type { Request, Response, NextFunction } from "express";
import type { IGetDoctorOnboardingUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorOnboardingUseCase.ts";
import type { IUpdateDoctorOnboardingUseCase } from "@application/interfaces/use-cases/doctor/IUpdateDoctorOnboardingUseCase.ts";
import type { IUploadDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IUploadDoctorDocumentUseCase.ts";
import type { IGetDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorDocumentUseCase.ts";
import type { ISubmitDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/ISubmitDoctorVerificationUseCase.ts";
import type { IListPendingDoctorVerificationsUseCase } from "@application/interfaces/use-cases/doctor/IListPendingDoctorVerificationsUseCase.ts";
import type { IGetDoctorVerificationDetailsUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorVerificationDetailsUseCase.ts";
import type { IApproveDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/IApproveDoctorVerificationUseCase.ts";
import type { IRejectDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/IRejectDoctorVerificationUseCase.ts";
import type { IGetClinicDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IGetClinicDoctorDocumentUseCase.ts";
import type { IGetDoctorConsultationFeeUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorConsultationFeeUseCase.ts";
import type { IUpdateDoctorConsultationFeeUseCase } from "@application/interfaces/use-cases/doctor/IUpdateDoctorConsultationFeeUseCase.ts";
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
    private readonly _submitVerificationUseCase: ISubmitDoctorVerificationUseCase,
    private readonly _listPendingVerificationsUseCase: IListPendingDoctorVerificationsUseCase,
    private readonly _getVerificationDetailsUseCase: IGetDoctorVerificationDetailsUseCase,
    private readonly _approveVerificationUseCase: IApproveDoctorVerificationUseCase,
    private readonly _rejectVerificationUseCase: IRejectDoctorVerificationUseCase,
    private readonly _getClinicDoctorDocumentUseCase: IGetClinicDoctorDocumentUseCase,
    private readonly _getConsultationFeeUseCase: IGetDoctorConsultationFeeUseCase,
    private readonly _updateConsultationFeeUseCase: IUpdateDoctorConsultationFeeUseCase,
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

  getVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._getOnboardingUseCase.execute(req.user!.sub, req.user!.clinicId!);
      res.status(HttpStatus.OK).json(ApiResponse.success("Doctor verification status retrieved", result));
    } catch (error) { next(error); }
  };

  submitVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._submitVerificationUseCase.execute(req.user!.sub, req.user!.clinicId!);
      res.status(HttpStatus.OK).json(ApiResponse.success("Doctor profile submitted for verification", result));
    } catch (error) { next(error); }
  };

  listPendingVerifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._listPendingVerificationsUseCase.execute(req.user!.clinicId!);
      res.status(HttpStatus.OK).json(ApiResponse.success("Pending doctor verifications retrieved", result));
    } catch (error) { next(error); }
  };

  getVerificationDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.doctorId;
      if (typeof doctorId !== "string") throw new ValidationError("Doctor id is required");
      const result = await this._getVerificationDetailsUseCase.execute(doctorId, req.user!.clinicId!);
      res.status(HttpStatus.OK).json(ApiResponse.success("Doctor verification details retrieved", result));
    } catch (error) { next(error); }
  };

  approveVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.doctorId;
      if (typeof doctorId !== "string") throw new ValidationError("Doctor id is required");
      const result = await this._approveVerificationUseCase.execute(doctorId, req.user!.clinicId!);
      res.status(HttpStatus.OK).json(ApiResponse.success("Doctor profile approved", result));
    } catch (error) { next(error); }
  };

  rejectVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.doctorId;
      if (typeof doctorId !== "string") throw new ValidationError("Doctor id is required");
      const result = await this._rejectVerificationUseCase.execute(
        doctorId,
        req.user!.clinicId!,
        req.body?.reason,
      );
      res.status(HttpStatus.OK).json(ApiResponse.success("Doctor profile rejected", result));
    } catch (error) { next(error); }
  };

  getClinicDoctorDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId, documentType } = req.params;
      if (typeof doctorId !== "string" || typeof documentType !== "string") {
        throw new ValidationError("Doctor id and document type are required");
      }
      const result = await this._getClinicDoctorDocumentUseCase.execute(
        doctorId,
        req.user!.clinicId!,
        documentType,
      );
      res.status(HttpStatus.OK).type(result.contentType).send(result.content);
    } catch (error) { next(error); }
  };

  getConsultationFee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._getConsultationFeeUseCase.execute(req.user!.sub, req.user!.clinicId!);
      res.status(HttpStatus.OK).json(ApiResponse.success("Doctor consultation fee retrieved", result));
    } catch (error) { next(error); }
  };

  updateConsultationFee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorId = req.params.doctorId;
      if (typeof doctorId !== "string") throw new ValidationError("Doctor id is required");
      const result = await this._updateConsultationFeeUseCase.execute({
        doctorId,
        clinicId: req.user!.clinicId!,
        consultationFee: req.body?.consultationFee,
      });
      res.status(HttpStatus.OK).json(ApiResponse.success("Doctor consultation fee updated", result));
    } catch (error) { next(error); }
  };
}
