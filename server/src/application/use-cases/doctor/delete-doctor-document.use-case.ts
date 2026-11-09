import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IDoctorDocumentStorage } from "@application/interfaces/services/IDoctorDocumentStorage.ts";
import type { IDeleteDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IDeleteDoctorDocumentUseCase.ts";
import type { DoctorOnboardingDTO } from "@application/dto/doctor/doctor-onboarding.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toDoctorOnboardingDTO } from "@application/mappers/doctor-onboarding.mapper.ts";
import { logger } from "@infrastructure/logger/logger.ts";

export class DeleteDoctorDocumentUseCase implements IDeleteDoctorDocumentUseCase {
  constructor(
    private readonly _doctorRepository: IDoctorRepository,
    private readonly _storage: IDoctorDocumentStorage,
  ) {}

  async execute(userId: string, clinicId: string, documentType: string): Promise<DoctorOnboardingDTO> {
    if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Doctor or clinic id is invalid");
    }
    if (!/^[a-zA-Z0-9_-]{2,50}$/.test(documentType)) throw new ValidationError("Document type is invalid");
    const doctor = await this._doctorRepository.findByUserId(userId);
    if (!doctor) throw new NotFoundError("Doctor onboarding profile");
    if (doctor.clinicId !== clinicId) throw new BadRequestError("Doctor profile belongs to another clinic");

    const documentKey = doctor.removeDocument(documentType);
    const saved = await this._doctorRepository.save(doctor);
    try {
      await this._storage.delete(documentKey);
    } catch (error) {
      logger.warn("Doctor document metadata removed but stored file cleanup failed", {
        documentType,
        message: error instanceof Error ? error.message : "Unknown storage error",
      });
    }
    return toDoctorOnboardingDTO(saved);
  }
}
