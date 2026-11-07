import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";

export interface IRejectDoctorVerificationUseCase {
  execute(doctorId: string, clinicId: string, reason: unknown): Promise<DoctorOnboardingDTO>;
}
