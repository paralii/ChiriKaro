import { DomainError } from "@domain/error/DomainError.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IUpdateClinicProfileUseCase } from "@application/interfaces/use-cases/clinic/IUpdateClinicProfileUseCase.ts";
import type {
  ClinicProfileDTO,
  UpdateClinicProfileDTO,
} from "@application/dto/clinic/clinic-profile.dto.ts";
import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toClinicProfileDTO } from "@application/mappers/clinic-profile.mapper.ts";

const PROFILE_FIELDS = [
  "name",
  "address",
  "city",
  "state",
  "pincode",
  "phone",
  "contactEmail",
  "registrationNumber",
] as const;

const normalizeUpdates = (value: unknown) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("Clinic profile updates must be an object");
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    throw new ValidationError("At least one clinic profile field is required");
  }
  for (const [key, fieldValue] of entries) {
    if (!(PROFILE_FIELDS as readonly string[]).includes(key)) {
      throw new ValidationError(`Clinic profile field ${key} cannot be updated`);
    }
    if (fieldValue !== null && typeof fieldValue !== "string") {
      throw new ValidationError(`Clinic profile field ${key} must be a string`);
    }
    if (key === "name" && typeof fieldValue !== "string") {
      throw new ValidationError("Clinic name must be a string");
    }
  }
  return value as {
    name?: string;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    phone?: string | null;
    contactEmail?: string | null;
    registrationNumber?: string | null;
  };
};

export class UpdateClinicProfileUseCase implements IUpdateClinicProfileUseCase {
  constructor(private readonly _clinicRepository: IClinicRepository) {}

  async execute(dto: UpdateClinicProfileDTO): Promise<ClinicProfileDTO> {
    if (!/^[a-f\d]{24}$/i.test(dto.clinicId)) {
      throw new BadRequestError("Clinic id is invalid");
    }
    const clinic = await this._clinicRepository.findById(dto.clinicId);
    if (!clinic) throw new NotFoundError("Clinic");

    try {
      clinic.updateProfile(normalizeUpdates(dto.updates));
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }

    return toClinicProfileDTO(await this._clinicRepository.save(clinic));
  }
}
