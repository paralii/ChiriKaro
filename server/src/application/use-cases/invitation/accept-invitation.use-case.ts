import { DomainError } from "@domain/error/DomainError.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { User } from "@domain/entities/user.entity.ts";
import { Role } from "@domain/value-objects/Role.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IInvitationRepository } from "@application/interfaces/repositories/IInvitationRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type { IInvitationTokenService } from "@application/interfaces/services/IInvitationTokenService.ts";
import type { IAcceptInvitationUseCase } from "@application/interfaces/use-cases/invitation/IAcceptInvitationUseCase.ts";
import type {
  AcceptInvitationDTO,
  AcceptInvitationResultDTO,
} from "@application/dto/invitation/accept-invitation.dto.ts";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@shared/errors/index.ts";

export class AcceptInvitationUseCase implements IAcceptInvitationUseCase {
  constructor(
    private readonly _invitationRepository: IInvitationRepository,
    private readonly _clinicRepository: IClinicRepository,
    private readonly _userRepository: IUserRepository,
    private readonly _tokenService: IInvitationTokenService,
    private readonly _passwordService: IPasswordService,
  ) {}

  async execute(dto: AcceptInvitationDTO): Promise<AcceptInvitationResultDTO> {
    if (dto === null || typeof dto !== "object") {
      throw new ValidationError("Invitation acceptance details are required");
    }
    if (typeof dto.token !== "string" || !/^[a-f\d]{64}$/i.test(dto.token)) {
      throw new BadRequestError("Invitation token is invalid");
    }
    if (typeof dto.name !== "string" || dto.name.trim().length < 2) {
      throw new ValidationError("Name must be at least 2 characters long");
    }
    if (typeof dto.password !== "string" || dto.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    const tokenHash = this._tokenService.hash(dto.token);
    const invitation = await this._invitationRepository.findByTokenHash(tokenHash);
    if (!invitation) throw new NotFoundError("Invitation");
    try {
      invitation.assertUsable();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new BadRequestError("Invitation is expired or no longer usable");
      }
      throw error;
    }
    if (invitation.role !== Role.DOCTOR && invitation.role !== Role.STAFF) {
      throw new BadRequestError("This invitation role cannot be registered here");
    }

    const clinic = await this._clinicRepository.findById(invitation.clinicId);
    if (!clinic || clinic.status !== ClinicStatus.APPROVED) {
      throw new BadRequestError("The clinic is not accepting registrations");
    }
    if (await this._userRepository.existsByEmail(invitation.email)) {
      throw new ConflictError("A user already exists for this invitation email");
    }

    const passwordHash = await this._passwordService.hash(dto.password);

    let user: User;
    try {
      user = User.create({
        name: dto.name.trim(),
        email: invitation.email,
        passwordHash,
        role: invitation.role,
        clinicId: invitation.clinicId,
        isEmailVerified: true,
      });
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }

    const savedUser = await this._userRepository.save(user);
    try {
      invitation.accept();
      const accepted = await this._invitationRepository.markAcceptedIfPending(
        invitation.id,
        invitation.tokenHash,
      );
      if (!accepted) throw new ConflictError("Invitation has already been used");
    } catch (error) {
      await this._userRepository.deleteById(savedUser.id);
      throw error;
    }

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      clinicId: savedUser.clinicId,
      status: savedUser.status,
    };
  }
}
