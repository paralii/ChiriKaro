import { DomainError } from "@domain/error/DomainError.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IDoctorDocumentStorage } from "@application/interfaces/services/IDoctorDocumentStorage.ts";
import type { IUploadDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IUploadDoctorDocumentUseCase.ts";
import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toDoctorOnboardingDTO } from "@application/mappers/doctor-onboarding.mapper.ts";
import { logger } from "@infrastructure/logger/logger.ts";

export class UploadDoctorDocumentUseCase implements IUploadDoctorDocumentUseCase {
  constructor(
    private readonly _doctorRepository: IDoctorRepository,
    private readonly _storage: IDoctorDocumentStorage,
  ) {}

  async execute(
    userId: string,
    clinicId: string,
    documentType: string,
    content: Buffer,
    contentType: string,
  ): Promise<DoctorOnboardingDTO> {
    if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Doctor or clinic id is invalid");
    }
    if (!/^[a-zA-Z0-9_-]{2,50}$/.test(documentType)) throw new ValidationError("Document type is invalid");
    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) throw new NotFoundError("Doctor onboarding profile");
    if (doctor.clinicId !== clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");
    if (doctor.verificationStatus !== "NOT_STARTED" && doctor.verificationStatus !== "IN_PROGRESS" && doctor.verificationStatus !== "REJECTED") {
      throw new ValidationError("Doctor onboarding cannot be edited in its current status");
    }
    const previousKey = doctor.documents.find((document) => document.documentType === documentType)?.documentKey;
    const key = await this._storage.save(content, contentType);
    try {
      doctor.addDocument({
        documentType,
        documentKey: key,
        status: "PENDING",
        uploadedAt: new Date(),
        verifiedAt: null,
        rejectionReason: null,
      });
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
    const saved = await this._doctorRepository.save(doctor);
    if (previousKey) {
      try { await this._storage.delete(previousKey); }
      catch (error) { logger.warn("Replaced doctor document cleanup failed", { documentType, message: error instanceof Error ? error.message : "Unknown storage error" }); }
    }
    return toDoctorOnboardingDTO(saved);
  }
}
