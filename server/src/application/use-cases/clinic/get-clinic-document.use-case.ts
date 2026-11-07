import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IClinicDocumentStorage, StoredClinicDocument } from "@application/interfaces/services/IClinicDocumentStorage.ts";
import type { IGetClinicDocumentUseCase } from "@application/interfaces/use-cases/clinic/IGetClinicDocumentUseCase.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";

export class GetClinicDocumentUseCase implements IGetClinicDocumentUseCase {
  constructor(private readonly _clinicRepository: IClinicRepository, private readonly _storage: IClinicDocumentStorage) {}

  async execute(clinicId: string, documentType: string): Promise<StoredClinicDocument> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Clinic id is invalid");
    const clinic = await this._clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    const document = clinic.documents.find((item) => item.documentType === documentType);
    if (!document) throw new NotFoundError("Clinic document");
    return this._storage.read(document.documentKey);
  }
}
