import type { ISuperAdminClinicRepository } from "@application/interfaces/repositories/ISuperAdminClinicRepository.ts";
import type { IGetClinicDetailsUseCase } from "@application/interfaces/use-cases/super-admin/IGetClinicDetailsUseCase.ts";
import type { ClinicDetailsDTO } from "@application/dto/super-admin/clinic-management.dto.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";
import { toClinicSummaryDTO } from "@application/mappers/clinic-summary.mapper.ts";

export class GetClinicDetailsUseCase implements IGetClinicDetailsUseCase {
  constructor(private readonly clinicRepository: ISuperAdminClinicRepository) {}

  async execute(clinicId: string): Promise<ClinicDetailsDTO> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Clinic id is invalid");
    }

    const clinic = await this.clinicRepository.findById(clinicId);

    if (!clinic) throw new NotFoundError("Clinic");

    return {
      ...toClinicSummaryDTO(clinic),
      city: clinic.city ?? null,
      state: clinic.state ?? null,
      pincode: clinic.pincode ?? null,
      registrationNumber: clinic.registrationNumber ?? null,
      setupStatus: clinic.setupStatus,
      specializations: clinic.specializations,
      workingHours: clinic.workingHours.map((hour) => ({
        day: hour.day,
        isOpen: hour.isOpen,
        startTime: hour.startTime,
        endTime: hour.endTime,
      })),
      documents: clinic.documents.map((doc) => ({
        documentType: doc.documentType,
        uploadedAt: doc.uploadedAt,
      })),
    };
  }
}