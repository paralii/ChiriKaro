import type { DoctorVerificationSummaryDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";

export interface IListPendingDoctorVerificationsUseCase {
  execute(clinicId: string): Promise<DoctorVerificationSummaryDTO[]>;
}
