import type { IInvitationRepository } from "@application/interfaces/repositories/IInvitationRepository.ts";
import type { IInvitationTokenService } from "@application/interfaces/services/IInvitationTokenService.ts";
import type { IInvitationLinkGenerator } from "@application/interfaces/services/IInvitationLinkGenerator.ts";
import type { IEmailService } from "@application/interfaces/services/IEmailService.ts";
import type { IResendInvitationUseCase } from "@application/interfaces/use-cases/invitation/IResendInvitationUseCase.ts";
import type { InvitationSummaryDTO } from "@application/dto/invitation/invitation.dto.ts";
import { BadRequestError, InternalServerError, NotFoundError } from "@shared/errors/index.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { toInvitationSummaryDTO } from "@application/mappers/invitation-summary.mapper.ts";

export class ResendInvitationUseCase implements IResendInvitationUseCase {
  constructor(
    private readonly _invitationRepository: IInvitationRepository,
    private readonly _tokenService: IInvitationTokenService,
    private readonly _linkGenerator: IInvitationLinkGenerator,
    private readonly _emailService: IEmailService,
  ) {}

  async execute(invitationId: string, clinicId: string): Promise<InvitationSummaryDTO> {
    if (!/^[a-f\d]{24}$/i.test(invitationId) || !/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Invitation id or clinic id is invalid");
    }
    const invitation = await this._invitationRepository.findPendingById(invitationId, clinicId);
    if (!invitation) throw new NotFoundError("Pending invitation");

    const { token, tokenHash } = this._tokenService.generate();
    invitation.resend(tokenHash);
    const savedInvitation = await this._invitationRepository.save(invitation);

    try {
      await this._emailService.sendInviteEmail(
        invitation.email,
        invitation.email.split("@")[0] ?? "there",
        this._linkGenerator.generate(token),
        invitation.role === Role.DOCTOR ? "doctor" : "staff member",
      );
    } catch {
      throw new InternalServerError("Invitation was updated, but the email could not be sent");
    }

    return toInvitationSummaryDTO(savedInvitation);
  }
}
