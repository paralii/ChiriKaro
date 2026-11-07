import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";

export interface IGetDoctorOnboardingUseCase {
  execute(userId: string, clinicId: string): Promise<DoctorOnboardingDTO>;
}
