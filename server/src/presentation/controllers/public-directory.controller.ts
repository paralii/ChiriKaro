import type { Request, Response, NextFunction } from "express";
import { MESSAGES } from "@shared/constants/messages.constants.ts";
import type { ISearchPublicDirectoryUseCase } from "@application/interfaces/use-cases/search/ISearchPublicDirectoryUseCase.ts";
import { ApiResponse } from "@shared/utils/ApiResponse.ts";
import { ValidationError } from "@shared/errors/index.ts";
import type { IGetPublicListingAvailabilityUseCase } from "@application/interfaces/use-cases/search/IGetPublicListingAvailabilityUseCase.ts";
import type { IGetPublicClinicProfileUseCase } from "@application/interfaces/use-cases/search/IGetPublicClinicProfileUseCase.ts";
import type { IGetPublicDoctorProfileUseCase } from "@application/interfaces/use-cases/search/IGetPublicDoctorProfileUseCase.ts";

function parseQueryString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new ValidationError(`${field} must be a single string`);
  return value;
}

function parseInteger(value: unknown, fallback: number, field: string): number {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) throw new ValidationError(`${field} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new ValidationError(`${field} must be a positive integer`);
  return parsed;
}

export class PublicDirectoryController {
  constructor(
    private readonly _searchUseCase: ISearchPublicDirectoryUseCase,
    private readonly _availabilityUseCase: IGetPublicListingAvailabilityUseCase,
    private readonly _clinicProfileUseCase: IGetPublicClinicProfileUseCase,
    private readonly _doctorProfileUseCase: IGetPublicDoctorProfileUseCase,
  ) {}

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = parseQueryString(req.query.q, "q");
      const city = parseQueryString(req.query.city, "city");
      const specialization = parseQueryString(req.query.specialization, "specialization");
      const result = await this._searchUseCase.execute({
        ...(query !== undefined ? { query } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(specialization !== undefined ? { specialization } : {}),
        page: parseInteger(req.query.page, 1, "page"),
        limit: parseInteger(req.query.limit, 12, "limit"),
      });
      ApiResponse.paginated(res, MESSAGES.response.directoryResultsRetrieved, result.items, {
        page: result.page,
        limit: result.limit,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
      });
    } catch (error) { next(error); }
  };

  clinicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listingId = req.params.listingId;
      if (typeof listingId !== "string") throw new ValidationError("Directory listing is required");
      const result = await this._clinicProfileUseCase.execute(listingId);
      ApiResponse.success(res, "Clinic profile retrieved", result);
    } catch (error) { next(error); }
  };

  doctorProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listingId = req.params.listingId;
      if (typeof listingId !== "string") throw new ValidationError("Directory listing is required");
      const result = await this._doctorProfileUseCase.execute(listingId);
      ApiResponse.success(res, "Doctor profile retrieved", result);
    } catch (error) { next(error); }
  };

  availability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listingId = req.params.listingId;
      if (typeof listingId !== "string") throw new ValidationError("Directory listing is required");
      const date = parseQueryString(req.query.date, "date");
      if (!date) throw new ValidationError("date is required");
      const result = await this._availabilityUseCase.execute(listingId, date);
      ApiResponse.success(res, MESSAGES.response.availabilityRetrieved, result);
    } catch (error) { next(error); }
  };
}

