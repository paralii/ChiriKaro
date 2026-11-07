import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";

export interface IApproveDoctorVerificationUseCase {
  execute(doctorId: string, clinicId: string): Promise<DoctorOnboardingDTO>;
}
