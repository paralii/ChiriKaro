import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";

export interface IUpdateClinicSetupUseCase {
  execute(clinicId: string, updates: unknown): Promise<ClinicProfileDTO>;
}
