import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";

export interface IGetDoctorVerificationDetailsUseCase {
  execute(doctorId: string, clinicId: string): Promise<DoctorOnboardingDTO>;
}
