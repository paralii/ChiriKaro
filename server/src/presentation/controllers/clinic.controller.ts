import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";

import type { IRegisterClinicUseCase } from "@application/interfaces/use-cases/clinic/IRegisterClinicUseCase.ts";
import type { IGetClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicProfileUseCase.ts";
import type { IUpdateClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicProfileUseCase.ts";
import type { IGetClinicDashboardUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDashboardUseCase.ts";
import type { IUpdateClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicSetupUseCase.ts";
import type { ISubmitClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/ISubmitClinicSetupUseCase.ts";
import type { IUploadClinicDocumentUseCase } from "@application/interfaces/use-cases/clinic/IUploadClinicDocumentUseCase.ts";
import type { IGetClinicDocumentUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDocumentUseCase.ts";
import { ValidationError } from "@shared/errors/index.ts";

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

  public updateSetup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._updateClinicSetupUseCase.execute(req.user!.clinicId!, req.body);
      res.status(HttpStatus.OK).json(ApiResponse.success("Clinic setup updated", result));
    } catch (error) { next(error); }
  };

  public uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!Buffer.isBuffer(req.body)) throw new ValidationError("Upload the document as a raw PDF, JPEG, or PNG body");
      const documentType = req.query.documentType;
      if (typeof documentType !== "string") throw new ValidationError("Document type is required");
      const result = await this._uploadClinicDocumentUseCase.execute(
        req.user!.clinicId!, documentType, req.body, req.header("content-type") ?? "",
      );
      res.status(HttpStatus.CREATED).json(ApiResponse.created("Clinic document uploaded", result));
    } catch (error) { next(error); }
  };

  public getDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const documentType = req.params.documentType;
      if (typeof documentType !== "string") throw new ValidationError("Document type is required");
      const result = await this._getClinicDocumentUseCase.execute(req.user!.clinicId!, documentType);
      res.status(HttpStatus.OK).type(result.contentType).send(result.content);
    } catch (error) { next(error); }
  };

  public submitSetup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._submitClinicSetupUseCase.execute(req.user!.clinicId!);
      res.status(HttpStatus.OK).json(ApiResponse.success("Clinic setup submitted for verification", result));
    } catch (error) { next(error); }
  };
}
