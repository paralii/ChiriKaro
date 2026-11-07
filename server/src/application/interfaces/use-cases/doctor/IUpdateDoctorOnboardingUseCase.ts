import type {
  DoctorOnboardingDTO,
  UpdateDoctorOnboardingDTO,
} from "@application/dto/doctor/doctor-onboarding.dto.ts";

export interface IUpdateDoctorOnboardingUseCase {
  execute(dto: UpdateDoctorOnboardingDTO): Promise<DoctorOnboardingDTO>;
}
