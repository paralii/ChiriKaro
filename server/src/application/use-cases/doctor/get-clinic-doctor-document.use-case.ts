import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IDoctorDocumentStorage } from "@application/interfaces/services/IDoctorDocumentStorage.ts";
import type { IGetClinicDoctorDocumentUseCase } from "@application/interfaces/use-cases/doctor/IGetClinicDoctorDocumentUseCase.ts";
import type { StoredDocument } from "@application/interfaces/services/IDocumentStorage.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";

export class GetClinicDoctorDocumentUseCase implements IGetClinicDoctorDocumentUseCase {
  constructor(
    private readonly doctorRepository: IDoctorRepository,
    private readonly documentStorage: IDoctorDocumentStorage,
  ) {}

  async execute(doctorId: string, clinicId: string, documentType: string): Promise<StoredDocument> {
    if (!/^[a-f\d]{24}$/i.test(doctorId) || !/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Doctor or clinic id is invalid");
    }
    const doctor = await this.doctorRepository.findByIdAndClinic(doctorId, clinicId);
    if (!doctor) throw new NotFoundError("Doctor verification profile");
    const document = doctor.documents.find((item) => item.documentType === documentType);
    if (!document) throw new NotFoundError("Doctor document");
    return this.documentStorage.read(document.documentKey);
  }
}
