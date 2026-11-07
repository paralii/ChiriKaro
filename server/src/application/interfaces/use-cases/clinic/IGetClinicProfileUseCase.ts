import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";

export interface IGetClinicProfileUseCase {
  execute(clinicId: string): Promise<ClinicProfileDTO>;
}
