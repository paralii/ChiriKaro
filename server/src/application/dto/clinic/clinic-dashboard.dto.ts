import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";

export interface ClinicDashboardDTO {
  clinic: ClinicProfileDTO;
  totalDoctors: number;
  totalStaff: number;
  totalTeamMembers: number;
}
