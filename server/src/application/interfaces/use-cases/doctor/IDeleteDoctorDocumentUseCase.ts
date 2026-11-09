import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";

export interface IDeleteDoctorDocumentUseCase {
  execute(userId: string, clinicId: string, documentType: string): Promise<DoctorOnboardingDTO>;
}
