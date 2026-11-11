import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { ValidationError } from "@shared/errors/index.ts";

import type { IRegisterClinicUseCase } from "@application/interfaces/use-cases/clinic/IRegisterClinicUseCase.ts";
import type { IGetClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicProfileUseCase.ts";
import type { IUpdateClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicProfileUseCase.ts";
import type { IGetClinicDashboardUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDashboardUseCase.ts";
import type { IUpdateClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicSetupUseCase.ts";
import type { ISubmitClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/ISubmitClinicSetupUseCase.ts";
import type { IUploadClinicDocumentUseCase } from "@application/interfaces/use-cases/clinic/IUploadClinicDocumentUseCase.ts";
import type { IGetClinicDocumentUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDocumentUseCase.ts";
import type { IUpdateDoctorConsultationFeeUseCase } from "@application/interfaces/use-cases/doctor/IUpdateDoctorConsultationFeeUseCase.ts";
import type { IListPendingDoctorVerificationsUseCase } from "@application/interfaces/use-cases/doctor/IListPendingDoctorVerificationsUseCase.ts";
import type { IGetDoctorVerificationDetailsUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorVerificationDetailsUseCase.ts";
import type { IApproveDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/IApproveDoctorVerificationUseCase.ts";
import type { IRejectDoctorVerificationUseCase } from "@application/interfaces/use-cases/doctor/IRejectDoctorVerificationUseCase.ts";
import type { IGetClinicDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IGetClinicDoctorDocumentUseCase.ts";

export class ClinicController {
  constructor(
    private readonly _registerClinicUseCase: IRegisterClinicUseCase,
    private readonly _getClinicProfileUseCase: IGetClinicProfileUseCase,
    private readonly _updateClinicProfileUseCase: IUpdateClinicProfileUseCase,
    private readonly _getClinicDashboardUseCase: IGetClinicDashboardUseCase,
    private readonly _updateClinicSetupUseCase: IUpdateClinicSetupUseCase,
    private readonly _submitClinicSetupUseCase: ISubmitClinicSetupUseCase,
    private readonly _uploadClinicDocumentUseCase: IUploadClinicDocumentUseCase,
    private readonly _getClinicDocumentUseCase: IGetClinicDocumentUseCase,
    private readonly _listPendingVerificationsUseCase: IListPendingDoctorVerificationsUseCase,
    private readonly _getVerificationDetailsUseCase: IGetDoctorVerificationDetailsUseCase,
    private readonly _approveVerificationUseCase: IApproveDoctorVerificationUseCase,
    private readonly _rejectVerificationUseCase: IRejectDoctorVerificationUseCase,
    private readonly _getClinicDoctorDocumentUseCase: IGetClinicDoctorDocumentUseCase,
    private readonly _updateConsultationFeeUseCase: IUpdateDoctorConsultationFeeUseCase,
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

      ApiResponse.created(res, message, data);
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
      ApiResponse.success(res, "Clinic profile retrieved", result);
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
      ApiResponse.success(res, "Clinic profile updated", result);
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
      ApiResponse.success(res, "Clinic dashboard retrieved", result);
    } catch (error) {
      next(error);
    }
  };

  public updateSetup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._updateClinicSetupUseCase.execute(
        req.user!.clinicId!,
        req.body,
      );
      ApiResponse.success(res, "Clinic setup updated", result);
    } catch (error) {
      next(error);
    }
  };

  public uploadDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!Buffer.isBuffer(req.body))
        throw new ValidationError(
          "Upload the document as a raw PDF, JPEG, or PNG body",
        );
      const documentType = req.query.documentType;
      if (typeof documentType !== "string")
        throw new ValidationError("Document type is required");
      const result = await this._uploadClinicDocumentUseCase.execute(
        req.user!.clinicId!,
        documentType,
        req.body,
        req.header("content-type") ?? "",
      );
      ApiResponse.created(res, "Clinic document uploaded", result);
    } catch (error) {
      next(error);
    }
  };

  public getDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const documentType = req.params.documentType;
      if (typeof documentType !== "string")
        throw new ValidationError("Document type is required");
      const result = await this._getClinicDocumentUseCase.execute(
        req.user!.clinicId!,
        documentType,
      );
      res.status(HttpStatus.OK).type(result.contentType).send(result.content);
    } catch (error) {
      next(error);
    }
  };

  public submitSetup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._submitClinicSetupUseCase.execute(
        req.user!.clinicId!,
      );
      ApiResponse.success(
        res,
        "Clinic setup submitted for verification",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  updateConsultationFee = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const doctorId = req.params.doctorId;
      if (typeof doctorId !== "string")
        throw new ValidationError("Doctor id is required");
      const result = await this._updateConsultationFeeUseCase.execute({
        doctorId,
        clinicId: req.user!.clinicId!,
        consultationFee: req.body?.consultationFee,
      });
      ApiResponse.success(res, "Doctor consultation fee updated", result);
    } catch (error) {
      next(error);
    }
  };
  listPendingVerifications = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._listPendingVerificationsUseCase.execute(
        req.user!.clinicId!,
      );
      ApiResponse.success(
        res,
        "Pending doctor verifications retrieved",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  getVerificationDetails = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const doctorId = req.params.doctorId;
      if (typeof doctorId !== "string")
        throw new ValidationError("Doctor id is required");
      const result = await this._getVerificationDetailsUseCase.execute(
        doctorId,
        req.user!.clinicId!,
      );
      ApiResponse.success(res, "Doctor verification details retrieved", result);
    } catch (error) {
      next(error);
    }
  };

  approveVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const doctorId = req.params.doctorId;
      if (typeof doctorId !== "string")
        throw new ValidationError("Doctor id is required");
      const result = await this._approveVerificationUseCase.execute(
        doctorId,
        req.user!.clinicId!,
      );
      ApiResponse.success(res, "Doctor profile approved", result);
    } catch (error) {
      next(error);
    }
  };

  rejectVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const doctorId = req.params.doctorId;
      if (typeof doctorId !== "string")
        throw new ValidationError("Doctor id is required");
      const result = await this._rejectVerificationUseCase.execute(
        doctorId,
        req.user!.clinicId!,
        req.body?.reason,
      );
      ApiResponse.success(res, "Doctor profile rejected", result);
    } catch (error) {
      next(error);
    }
  };

  getClinicDoctorDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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
    } catch (error) {
      next(error);
    }
  };
}
