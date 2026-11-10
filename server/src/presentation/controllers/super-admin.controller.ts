import type { NextFunction, Request, Response } from "express";
import { ValidationError } from "@shared/errors/index.ts";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";

import type { ClinicListQueryDTO } from "@application/dto/super-admin/clinic-management.dto.ts";
import type { IListClinicsUseCase } from "@application/interfaces/use-cases/super-admin/IListClinicsUseCase.ts";
import type { IGetClinicDetailsUseCase } from "@application/interfaces/use-cases/super-admin/IGetClinicDetailsUseCase.ts";
import type { IUpdateClinicStatusUseCase } from "@application/interfaces/use-cases/super-admin/IUpdateClinicStatusUseCase.ts";
import type { IGetSuperAdminStatisticsUseCase } from "@application/interfaces/use-cases/super-admin/IGetSuperAdminStatisticsUseCase.ts";
import type { IGetClinicDocumentUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDocumentUseCase.ts";

export class SuperAdminController {
  constructor(
    private readonly _listClinicsUseCase: IListClinicsUseCase,
    private readonly _getClinicDetailsUseCase: IGetClinicDetailsUseCase,
    private readonly _updateClinicStatusUseCase: IUpdateClinicStatusUseCase,
    private readonly _getStatisticsUseCase: IGetSuperAdminStatisticsUseCase,
    private readonly _getClinicDocumentUseCase: IGetClinicDocumentUseCase,
  ) {}

  listClinics = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._listClinicsUseCase.execute(
        req.query as unknown as ClinicListQueryDTO,
      );
      ApiResponse.paginated(
        res,
        "Clinics retrieved successfully",
        result.clinics,
        {
          page: result.page,
          limit: result.limit,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
        },
      );
    } catch (error) {
      next(error);
    }
  };

  getClinic = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const clinic = await this._getClinicDetailsUseCase.execute(
        req.params.id as string,
      );
      ApiResponse.success(res, "Clinic retrieved successfully", clinic);
    } catch (error) {
      next(error);
    }
  };

  updateClinicStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const clinic = await this._updateClinicStatusUseCase.execute({
        clinicId: req.params.id as string,
        status: req.body?.status,
      });
      ApiResponse.success(res, "Clinic status updated successfully", clinic);
    } catch (error) {
      next(error);
    }
  };

  getStatistics = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this._getStatisticsUseCase.execute();
      ApiResponse.success(
        res,
        "Super Admin statistics retrieved successfully",
        result,
      );
    } catch (error) {
      next(error);
    }
  };

  getClinicDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id, documentType } = req.params;
      if (typeof id !== "string" || typeof documentType !== "string")
        throw new ValidationError("Clinic and document are required");
      const result = await this._getClinicDocumentUseCase.execute(
        id,
        documentType,
      );
      res.status(HttpStatus.OK).type(result.contentType).send(result.content);
    } catch (error) {
      next(error);
    }
  };
}
