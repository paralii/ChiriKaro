import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";

export interface IUploadDoctorDocumentUseCase {
  execute(userId: string, clinicId: string, documentType: string, content: Buffer, contentType: string): Promise<DoctorOnboardingDTO>;
}
