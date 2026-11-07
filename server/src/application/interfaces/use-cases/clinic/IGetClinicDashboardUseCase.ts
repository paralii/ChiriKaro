import type { ClinicDashboardDTO } from "@application/dto/clinic/clinic-dashboard.dto.ts";

export interface IGetClinicDashboardUseCase {
  execute(clinicId: string): Promise<ClinicDashboardDTO>;
}
