import type { IInvitationRepository } from "@application/interfaces/repositories/IInvitationRepository.ts";
import type { IListPendingInvitationsUseCase } from "@application/interfaces/use-cases/invitation/IListPendingInvitationsUseCase.ts";
import type { InvitationSummaryDTO } from "@application/dto/invitation/invitation.dto.ts";
import { BadRequestError } from "@shared/errors/index.ts";
import { toInvitationSummaryDTO } from "@application/mappers/invitation-summary.mapper.ts";

export class ListPendingInvitationsUseCase implements IListPendingInvitationsUseCase {
  constructor(private readonly _invitationRepository: IInvitationRepository) {}

  async execute(clinicId: string): Promise<InvitationSummaryDTO[]> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) {
      throw new BadRequestError("Clinic id is invalid");
    }
    const invitations = await this._invitationRepository.findPendingByClinic(clinicId);
    return invitations.map(toInvitationSummaryDTO);
  }
}
