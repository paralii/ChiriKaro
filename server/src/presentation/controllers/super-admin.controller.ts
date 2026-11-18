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
import type { IManagePatientsUseCase } from "@application/interfaces/use-cases/super-admin/IManagePatientsUseCase.ts";
import type { IManageDoctorsUseCase } from "@application/interfaces/use-cases/super-admin/IManageDoctorsUseCase.ts";
import type { DoctorListQueryDTO } from "@application/dto/super-admin/clinic-management.dto.ts";

export class SuperAdminController {
  constructor(
    private readonly _listClinicsUseCase: IListClinicsUseCase,
    private readonly _getClinicDetailsUseCase: IGetClinicDetailsUseCase,
    private readonly _updateClinicStatusUseCase: IUpdateClinicStatusUseCase,
    private readonly _getStatisticsUseCase: IGetSuperAdminStatisticsUseCase,
    private readonly _getClinicDocumentUseCase: IGetClinicDocumentUseCase,
    private readonly _managePatientsUseCase: IManagePatientsUseCase,
    private readonly _manageDoctorsUseCase: IManageDoctorsUseCase,
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
        reason: req.body?.reason,
        reviewerId: req.user!.sub,
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

  listPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._managePatientsUseCase.list(req.query);
      ApiResponse.paginated(res, "Patients retrieved successfully", result.patients, {
        page: result.page, limit: result.limit, totalItems: result.totalItems, totalPages: result.totalPages,
      });
    } catch (error) { next(error); }
  };

  updatePatientStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patient = await this._managePatientsUseCase.setStatus(req.params.id as string, req.body?.status);
      ApiResponse.success(res, "Patient status updated successfully", patient);
    } catch (error) { next(error); }
  };

  getPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patient = await this._managePatientsUseCase.getDetails(req.params.id as string);
      ApiResponse.success(res, "Patient retrieved successfully", patient);
    } catch (error) { next(error); }
  };

  listDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this._manageDoctorsUseCase.list(req.query as unknown as DoctorListQueryDTO);
      ApiResponse.paginated(res, "Doctors retrieved successfully", result.doctors, {
        page: result.page, limit: result.limit, totalItems: result.totalItems, totalPages: result.totalPages,
      });
    } catch (error) { next(error); }
  };

  getDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctor = await this._manageDoctorsUseCase.getDetails(req.params.id as string);
      ApiResponse.success(res, "Doctor retrieved successfully", doctor);
    } catch (error) { next(error); }
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
