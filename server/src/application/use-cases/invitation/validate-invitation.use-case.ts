import { DomainError } from "@domain/error/DomainError.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IInvitationRepository } from "@application/interfaces/repositories/IInvitationRepository.ts";
import type { IInvitationTokenService } from "@application/interfaces/services/IInvitationTokenService.ts";
import type { IValidateInvitationUseCase } from "@application/interfaces/use-cases/invitation/IValidateInvitationUseCase.ts";
import type { ValidateInvitationResultDTO } from "@application/dto/invitation/accept-invitation.dto.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";

export class ValidateInvitationUseCase implements IValidateInvitationUseCase {
  constructor(
    private readonly _invitationRepository: IInvitationRepository,
    private readonly _clinicRepository: IClinicRepository,
    private readonly _tokenService: IInvitationTokenService,
  ) {}

  async execute(token: unknown): Promise<ValidateInvitationResultDTO> {
    if (typeof token !== "string" || !/^[a-f\d]{64}$/i.test(token)) {
      throw new BadRequestError("Invitation token is invalid");
    }
    const invitation = await this._invitationRepository.findByTokenHash(
      this._tokenService.hash(token),
    );
    if (!invitation) throw new NotFoundError("Invitation");

    try {
      invitation.assertUsable();
    } catch (error) {
      if (error instanceof DomainError) {
        throw new BadRequestError("Invitation is expired or no longer usable");
      }
      throw error;
    }

    const clinic = await this._clinicRepository.findById(invitation.clinicId);
    if (!clinic || clinic.status !== ClinicStatus.APPROVED) {
      throw new BadRequestError("The clinic is not accepting registrations");
    }

    return {
      email: invitation.email,
      role: invitation.role,
      clinicId: invitation.clinicId,
      clinicName: clinic.name,
      expiresAt: invitation.expiresAt,
    };
  }
}
