import { DomainError } from "@domain/error/DomainError.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IClinicDocumentStorage } from "@application/interfaces/services/IClinicDocumentStorage.ts";
import type { IUploadClinicDocumentUseCase } from "@application/interfaces/use-cases/clinic/IUploadClinicDocumentUseCase.ts";
import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";
import {
  BadRequestError,
  NotFoundError,
  ValidationError,
} from "@shared/errors/index.ts";
import { toClinicProfileDTO } from "@application/mappers/clinic-profile.mapper.ts";

export class UploadClinicDocumentUseCase implements IUploadClinicDocumentUseCase {
  constructor(
    private readonly _clinicRepository: IClinicRepository,
    private readonly _storage: IClinicDocumentStorage,
  ) {}

  async execute(
    clinicId: string,
    documentType: string,
    content: Buffer,
    contentType: string,
  ): Promise<ClinicProfileDTO> {
    if (!/^[a-f\d]{24}$/i.test(clinicId))
      throw new BadRequestError("Clinic id is invalid");
    if (!/^[a-zA-Z0-9_-]{2,50}$/.test(documentType))
      throw new ValidationError("Document type is invalid");
    const clinic = await this._clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    const key = await this._storage.save(content, contentType);
    try {
      clinic.addDocument({
        documentType,
        documentKey: key,
        uploadedAt: new Date(),
      });
    } catch (error) {
      if (error instanceof DomainError)
        throw new ValidationError(error.message);
      throw error;
    }
    return toClinicProfileDTO(await this._clinicRepository.save(clinic));
  }
}
