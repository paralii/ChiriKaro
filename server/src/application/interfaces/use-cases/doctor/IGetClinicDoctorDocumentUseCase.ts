import type { StoredDocument } from "@application/interfaces/services/IDocumentStorage.ts";

export interface IGetClinicDoctorDocumentUseCase {
  execute(doctorId: string, clinicId: string, documentType: string): Promise<StoredDocument>;
}
