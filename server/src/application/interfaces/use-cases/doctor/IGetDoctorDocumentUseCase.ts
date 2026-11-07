import type { StoredDocument } from "@application/interfaces/services/IDocumentStorage.ts";

export interface IGetDoctorDocumentUseCase {
  execute(userId: string, documentType: string): Promise<StoredDocument>;
}
