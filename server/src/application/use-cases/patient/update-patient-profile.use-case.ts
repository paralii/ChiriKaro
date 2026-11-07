import { DomainError } from "@domain/error/DomainError.ts";
import { Role } from "@domain/value-objects/Role.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IUpdatePatientProfileUseCase } from "@application/interfaces/use-cases/patient/IUpdatePatientProfileUseCase.ts";
import type {
  PatientProfileDTO,
  UpdatePatientProfileDTO,
} from "@application/dto/patient/patient-profile.dto.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "@shared/errors/index.ts";

const PROFILE_FIELDS = ["name", "avatar"] as const;

export class UpdatePatientProfileUseCase implements IUpdatePatientProfileUseCase {
  constructor(private readonly _userRepository: IUserRepository) {}

  async execute(dto: UpdatePatientProfileDTO): Promise<PatientProfileDTO> {
    const updateFields = Object.keys(dto).filter((field) => field !== "userId");
    if (updateFields.length === 0) {
      throw new ValidationError("At least one profile field is required");
    }
    if (updateFields.some((field) => !(PROFILE_FIELDS as readonly string[]).includes(field))) {
      throw new ValidationError("Only name and avatar can be updated");
    }
    if (
      dto.name !== undefined &&
      (typeof dto.name !== "string" ||
        dto.name.trim().length < 2 ||
        dto.name.trim().length > 100)
    ) {
      throw new ValidationError("Name must be between 2 and 100 characters long");
    }
    if (
      dto.avatar !== undefined &&
      dto.avatar !== null &&
      (typeof dto.avatar !== "string" || dto.avatar.trim().length === 0)
    ) {
      throw new ValidationError("Avatar must be a non-empty string or null");
    }

    const user = await this._userRepository.findById(dto.userId);
    if (!user) throw new NotFoundError("User");
    if (user.role !== Role.PATIENT) {
      throw new ForbiddenError("Only patients can update this profile");
    }

    try {
      if (dto.name !== undefined) user.rename(dto.name);
      if (dto.avatar !== undefined) {
        user.updateAvatar(dto.avatar === null ? null : dto.avatar as string);
      }
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }

    const savedUser = await this._userRepository.update(user);
    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      avatar: savedUser.avatar ?? null,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }
}
