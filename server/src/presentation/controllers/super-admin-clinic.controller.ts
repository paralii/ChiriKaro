import type { NextFunction, Request, Response } from "express";
import { HttpStatus } from "@shared/enums/http-status.enum.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import type { ClinicListQueryDTO } from "@application/dto/super-admin/clinic-management.dto.ts";
import type { IListClinicsUseCase } from "@application/interfaces/use-cases/super-admin/IListClinicsUseCase.ts";
import type { IGetClinicDetailsUseCase } from "@application/interfaces/use-cases/super-admin/IGetClinicDetailsUseCase.ts";
import type { IUpdateClinicStatusUseCase } from "@application/interfaces/use-cases/super-admin/IUpdateClinicStatusUseCase.ts";

export class SuperAdminClinicController {
  constructor(
    private readonly listClinicsUseCase: IListClinicsUseCase,
    private readonly getClinicDetailsUseCase: IGetClinicDetailsUseCase,
    private readonly updateClinicStatusUseCase: IUpdateClinicStatusUseCase,
  ) {}

  listClinics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.listClinicsUseCase.execute(
        req.query as unknown as ClinicListQueryDTO,
      );
      res.status(HttpStatus.OK).json(
        ApiResponse.success("Clinics retrieved successfully", result.clinics, {
          page: result.page,
          limit: result.limit,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
        }),
      );
    } catch (error) {
      next(error);
    }
  };

  getClinic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clinic = await this.getClinicDetailsUseCase.execute(req.params.id as string);
      res.status(HttpStatus.OK).json(ApiResponse.success("Clinic retrieved successfully", clinic));
    } catch (error) {
      next(error);
    }
  };

  updateClinicStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clinic = await this.updateClinicStatusUseCase.execute({
        clinicId: req.params.id as string,
        status: req.body?.status,
      });
      res.status(HttpStatus.OK).json(ApiResponse.success("Clinic status updated successfully", clinic));
    } catch (error) {
      next(error);
    }
  };
}
