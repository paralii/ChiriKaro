import type { ClinicSummaryDTO } from "@application/dto/super-admin/clinic-management.dto.ts";

export interface IGetClinicDetailsUseCase {
  execute(clinicId: string): Promise<ClinicSummaryDTO>;
}
