import type { ISuperAdminClinicRepository } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";
import type { IManagePatientsUseCase } from "@application/interfaces/use-cases/super-admin/IManagePatientsUseCase.ts";
import type { PatientListQueryDTO, PatientListResultDTO } from "@application/dto/super-admin/clinic-management.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { buildPaginationMeta, resolvePagination } from "@shared/utils/pagination.ts";

const parsePositiveInteger = (value: unknown, field: string): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" && typeof value !== "number") throw new ValidationError(`${field} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new ValidationError(`${field} must be a positive integer`);
  return parsed;
};

export class ManagePatientsUseCase implements IManagePatientsUseCase {
  constructor(private readonly repository: ISuperAdminClinicRepository) {}

  async list(query: PatientListQueryDTO): Promise<PatientListResultDTO> {
    const page = parsePositiveInteger(query.page, "page");
    const limit = parsePositiveInteger(query.limit, "limit");
    const pagination = resolvePagination({ ...(page !== undefined ? { page } : {}), ...(limit !== undefined ? { limit } : {}) });
    const result = await this.repository.findPatientsPage(pagination);
    return { patients: result.patients, ...buildPaginationMeta(pagination.page, pagination.limit, result.totalItems) };
  }

  async setStatus(patientId: string, status: unknown) {
    if (!/^[a-f\d]{24}$/i.test(patientId)) throw new BadRequestError("Patient id is invalid");
    if (status !== "ACTIVE" && status !== "SUSPENDED") throw new ValidationError("Patient status must be ACTIVE or SUSPENDED");
    const patient = await this.repository.updatePatientStatus(patientId, status);
    if (!patient) throw new NotFoundError("Patient");
    return patient;
  }
}
