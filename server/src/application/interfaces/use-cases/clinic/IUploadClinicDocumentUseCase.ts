import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";

export interface IUploadClinicDocumentUseCase {
  execute(
    clinicId: string,
    documentType: string,
    content: Buffer,
    contentType: string,
  ): Promise<ClinicProfileDTO>;
}
