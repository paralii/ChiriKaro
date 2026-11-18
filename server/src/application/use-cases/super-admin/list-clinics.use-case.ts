import type { ISuperAdminClinicRepository } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";
import type { IListClinicsUseCase } from "@application/interfaces/use-cases/super-admin/IListClinicsUseCase.ts";
import type {
  ClinicListQueryDTO,
  ClinicListResultDTO,
} from "@application/dto/super-admin/clinic-management.dto.ts";
import { ValidationError } from "@shared/errors/index.ts";
import { buildPaginationMeta, resolvePagination } from "@shared/utils/pagination.ts";
import { toClinicSummaryDTO } from "@application/mappers/clinic-summary.mapper.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";

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
    const search = this.parseSearch(query.search);
    const status = this.parseStatus(query.status);
    const { clinics, totalItems } = await this.clinicRepository.findPage({ ...pagination, ...(search ? { search } : {}), ...(status ? { status } : {}) });
    const meta = buildPaginationMeta(pagination.page, pagination.limit, totalItems);
    return { clinics: clinics.map(toClinicSummaryDTO), ...meta };
  }

  private parseSearch(value: unknown): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || value.length > 100) throw new ValidationError("search must be a string no longer than 100 characters");
    return value.trim() || undefined;
  }

  private parseStatus(value: unknown): ClinicStatus | undefined {
    if (value === undefined || value === "") return undefined;
    if (typeof value !== "string" || !Object.values(ClinicStatus).includes(value as ClinicStatus)) throw new ValidationError("Clinic status filter is invalid");
    return value as ClinicStatus;
  }
}
