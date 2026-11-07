import { DomainError } from "@domain/error/DomainError.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IUpdateClinicSetupUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicSetupUseCase.ts";
import type { ClinicProfileDTO } from "@application/dto/clinic/clinic-profile.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toClinicProfileDTO } from "@application/mappers/clinic-profile.mapper.ts";

export class UpdateClinicSetupUseCase implements IUpdateClinicSetupUseCase {
  constructor(private readonly _clinicRepository: IClinicRepository) {}

  async execute(clinicId: string, updates: unknown): Promise<ClinicProfileDTO> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Clinic id is invalid");
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
      throw new ValidationError("Clinic setup updates must be an object");
    }
    const clinic = await this._clinicRepository.findById(clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    const data = updates as Record<string, unknown>;
    const allowed = ["location", "specializations", "workingHours"];
    if (!Object.keys(data).length || Object.keys(data).some((key) => !allowed.includes(key))) {
      throw new ValidationError("Provide only location, specializations, or workingHours");
    }
    try {
      if (data.location !== undefined) {
        if (!data.location || typeof data.location !== "object" || Array.isArray(data.location)) throw new ValidationError("Location must be an object");
        const location = data.location as Record<string, unknown>;
        const allowedLocation = ["address", "city", "state", "pincode"];
        if (Object.keys(location).some((key) => !allowedLocation.includes(key))) throw new ValidationError("Location contains unsupported fields");
        if (Object.values(location).some((value) => value !== null && typeof value !== "string")) throw new ValidationError("Location values must be strings or null");
        clinic.updateProfile(location as Parameters<typeof clinic.updateProfile>[0]);
      }
      if (data.specializations !== undefined) {
        if (!Array.isArray(data.specializations) || data.specializations.some((item) => typeof item !== "string")) throw new ValidationError("Specializations must be an array of strings");
        clinic.updateSpecializations(data.specializations as string[]);
      }
      if (data.workingHours !== undefined) {
        if (!Array.isArray(data.workingHours)) throw new ValidationError("Working hours must be an array");
        clinic.updateWorkingHours(data.workingHours as Parameters<typeof clinic.updateWorkingHours>[0]);
      }
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }
    return toClinicProfileDTO(await this._clinicRepository.save(clinic));
  }
}
