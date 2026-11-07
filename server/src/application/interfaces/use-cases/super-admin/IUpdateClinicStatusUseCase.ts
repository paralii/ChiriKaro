import type {
  ClinicSummaryDTO,
  UpdateClinicStatusDTO,
} from "@application/dto/super-admin/clinic-management.dto.ts";

export interface IUpdateClinicStatusUseCase {
  execute(dto: UpdateClinicStatusDTO): Promise<ClinicSummaryDTO>;
}
