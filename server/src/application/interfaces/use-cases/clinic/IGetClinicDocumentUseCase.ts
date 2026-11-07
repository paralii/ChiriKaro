import type { StoredClinicDocument } from "@application/interfaces/services/IClinicDocumentStorage.ts";

export interface IGetClinicDocumentUseCase {
  execute(clinicId: string, documentType: string): Promise<StoredClinicDocument>;
}
