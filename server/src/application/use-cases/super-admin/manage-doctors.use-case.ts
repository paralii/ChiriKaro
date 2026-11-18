import type { ISuperAdminClinicRepository } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";
import type { IManageDoctorsUseCase } from "@application/interfaces/use-cases/super-admin/IManageDoctorsUseCase.ts";
import type { DoctorListQueryDTO, DoctorListResultDTO, DoctorDetailDTO } from "@application/dto/super-admin/clinic-management.dto.ts";
import type { DoctorVerificationStatus } from "@domain/entities/doctor.entity.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { buildPaginationMeta, resolvePagination } from "@shared/utils/pagination.ts";

const VERIFICATION_STATUSES: DoctorVerificationStatus[] = ["NOT_STARTED", "IN_PROGRESS", "PENDING_VERIFICATION", "VERIFIED", "REJECTED"];
const parsePositiveInteger = (value: unknown, field: string): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" && typeof value !== "number") throw new ValidationError(`${field} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new ValidationError(`${field} must be a positive integer`);
  return parsed;
};

export class ManageDoctorsUseCase implements IManageDoctorsUseCase {
  constructor(private readonly repository: ISuperAdminClinicRepository) {}

  async list(query: DoctorListQueryDTO): Promise<DoctorListResultDTO> {
    const page = parsePositiveInteger(query.page, "page");
    const limit = parsePositiveInteger(query.limit, "limit");
    const search = this.parseSearch(query.search);
    const status = query.status === undefined || query.status === "" ? undefined : query.status;
    if (status !== undefined && (typeof status !== "string" || !VERIFICATION_STATUSES.includes(status as DoctorVerificationStatus))) throw new ValidationError("Doctor status filter is invalid");
    const pagination = resolvePagination({ ...(page !== undefined ? { page } : {}), ...(limit !== undefined ? { limit } : {}) });
    const result = await this.repository.findDoctorsPage({ ...pagination, ...(search ? { search } : {}), ...(status ? { status: status as DoctorVerificationStatus } : {}) });
    return { doctors: result.doctors, ...buildPaginationMeta(pagination.page, pagination.limit, result.totalItems) };
  }

  async getDetails(doctorId: string): Promise<DoctorDetailDTO> {
    if (!/^[a-f\d]{24}$/i.test(doctorId)) throw new BadRequestError("Doctor id is invalid");
    const doctor = await this.repository.findDoctorDetails(doctorId);
    if (!doctor) throw new NotFoundError("Doctor");
    const { id: _internalId, ...details } = doctor;
    void _internalId;
    return details;
  }

  private parseSearch(value: unknown): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== "string" || value.length > 100) throw new ValidationError("search must be a string no longer than 100 characters");
    return value.trim() || undefined;
  }
}
