import type { ClinicDetailsDTO } from "@application/dto/super-admin/clinic-management.dto.ts";

export interface IGetClinicDetailsUseCase {
  execute(clinicId: string): Promise<ClinicDetailsDTO>;
}
