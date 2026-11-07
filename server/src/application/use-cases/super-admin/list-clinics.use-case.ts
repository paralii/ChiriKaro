import type { ISuperAdminClinicRepository } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";
import type { IListClinicsUseCase } from "@application/interfaces/use-cases/super-admin/IListClinicsUseCase.ts";
import type {
  ClinicListQueryDTO,
  ClinicListResultDTO,
} from "@application/dto/super-admin/clinic-management.dto.ts";
import { ValidationError } from "@shared/errors/index.ts";
import { buildPaginationMeta, resolvePagination } from "@shared/utils/pagination.ts";
import { toClinicSummaryDTO } from "@application/mappers/clinic-summary.mapper.ts";

const parsePositiveInteger = (value: unknown, field: string): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new ValidationError(`${field} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`${field} must be a positive integer`);
  }
  return parsed;
};

export class ListClinicsUseCase implements IListClinicsUseCase {
  constructor(private readonly clinicRepository: ISuperAdminClinicRepository) {}

  async execute(query: ClinicListQueryDTO): Promise<ClinicListResultDTO> {
    const page = parsePositiveInteger(query.page, "page");
    const limit = parsePositiveInteger(query.limit, "limit");
    const pagination = resolvePagination({
      ...(page !== undefined ? { page } : {}),
      ...(limit !== undefined ? { limit } : {}),
    });
    const { clinics, totalItems } = await this.clinicRepository.findPage(pagination);
    const meta = buildPaginationMeta(pagination.page, pagination.limit, totalItems);
    return { clinics: clinics.map(toClinicSummaryDTO), ...meta };
  }
}
