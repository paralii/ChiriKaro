import { DomainError } from "@domain/error/DomainError.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { Invitation } from "@domain/entities/Invitation.entity.ts";
import { Role, INVITE_PERMISSIONS } from "@domain/value-objects/Role.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IInvitationRepository } from "@application/interfaces/repositories/IInvitationRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IEmailService } from "@application/interfaces/services/IEmailService.ts";
import type { IInvitationTokenService } from "@application/interfaces/services/IInvitationTokenService.ts";
import type { IInvitationLinkGenerator } from "@application/interfaces/services/IInvitationLinkGenerator.ts";
import type { ICreateInvitationUseCase } from "@application/interfaces/use-cases/invitation/ICreateInvitationUseCase.ts";
import type { CreateInvitationDTO, InvitationSummaryDTO } from "@application/dto/invitation/invitation.dto.ts";
import { BadRequestError, ConflictError, InternalServerError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { toInvitationSummaryDTO } from "@application/mappers/invitation-summary.mapper.ts";

export class CreateInvitationUseCase implements ICreateInvitationUseCase {
  constructor(
    private readonly _clinicRepository: IClinicRepository,
    private readonly _userRepository: IUserRepository,
    private readonly _invitationRepository: IInvitationRepository,
    private readonly _tokenService: IInvitationTokenService,
    private readonly _linkGenerator: IInvitationLinkGenerator,
    private readonly _emailService: IEmailService,
  ) {}

  async execute(dto: CreateInvitationDTO): Promise<InvitationSummaryDTO> {
    if (!/^[a-f\d]{24}$/i.test(dto.clinicId)) {
      throw new BadRequestError("Clinic id is invalid");
    }
    if (!/^[a-f\d]{24}$/i.test(dto.invitedBy)) {
      throw new BadRequestError("Inviter id is invalid");
    }
    if (typeof dto.email !== "string" || typeof dto.role !== "string") {
      throw new ValidationError("Email and role are required");
    }

    const email = dto.email.trim().toLowerCase();
    const allowedRoles = INVITE_PERMISSIONS[Role.CLINIC_ADMIN];
    if (!allowedRoles.includes(dto.role)) {
      throw new ValidationError("Only Doctor and Staff invitations are supported");
    }

    const clinic = await this._clinicRepository.findById(dto.clinicId);
    if (!clinic) throw new NotFoundError("Clinic");
    if (clinic.status !== ClinicStatus.APPROVED) {
      throw new BadRequestError("Clinic must be approved before invitations can be sent");
    }
    if (await this._userRepository.existsByEmail(email)) {
      throw new ConflictError("A user with this email already exists");
    }
    if (await this._invitationRepository.findPendingByEmail(email, dto.clinicId)) {
      throw new ConflictError("A pending invitation already exists for this email");
    }

    const { token, tokenHash } = this._tokenService.generate();
    let invitation: Invitation;
    try {
      invitation = Invitation.create({
        email,
        role: dto.role,
        clinicId: dto.clinicId,
        invitedBy: dto.invitedBy,
        tokenHash,
      });
    } catch (error) {
      if (error instanceof DomainError) throw new ValidationError(error.message);
      throw error;
    }

    const savedInvitation = await this._invitationRepository.save(invitation);
    try {
      const roleLabel = dto.role === Role.DOCTOR ? "doctor" : "staff member";
      await this._emailService.sendInviteEmail(
        email,
        email.split("@")[0] ?? "there",
        this._linkGenerator.generate(token),
        roleLabel,
      );
    } catch {
      await this._invitationRepository.deleteById(savedInvitation.id);
      throw new InternalServerError("Invitation was created, but the email could not be sent");
    }

    return toInvitationSummaryDTO(savedInvitation);
  }
}
