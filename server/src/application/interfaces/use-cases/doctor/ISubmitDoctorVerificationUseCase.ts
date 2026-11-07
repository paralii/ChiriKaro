import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";

export interface ISubmitDoctorVerificationUseCase {
  execute(userId: string, clinicId: string): Promise<DoctorOnboardingDTO>;
}
