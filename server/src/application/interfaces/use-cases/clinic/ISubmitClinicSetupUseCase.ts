import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";

export interface ISubmitClinicSetupUseCase {
  execute(clinicId: string): Promise<ClinicProfileDTO>;
}
