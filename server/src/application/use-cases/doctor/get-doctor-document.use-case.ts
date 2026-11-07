import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IDoctorDocumentStorage } from "@application/interfaces/services/IDoctorDocumentStorage.ts";
import type { IGetDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IGetDoctorDocumentUseCase.ts";
import type { StoredDocument } from "@application/interfaces/services/IDocumentStorage.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";

export class GetDoctorDocumentUseCase implements IGetDoctorDocumentUseCase {
  constructor(
    private readonly _doctorRepository: IDoctorRepository,
    private readonly _storage: IDoctorDocumentStorage,
  ) {}

  async execute(userId: string, documentType: string): Promise<StoredDocument> {
    if (!/^[a-f\d]{24}$/i.test(userId)) throw new BadRequestError("Doctor id is invalid");
    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) throw new NotFoundError("Doctor onboarding profile");
    const document = doctor.documents.find((item) => item.documentType === documentType);
    if (!document) throw new NotFoundError("Doctor document");
    return this._storage.read(document.documentKey);
  }
}
