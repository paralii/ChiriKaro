import type { InvitationSummaryDTO } from "@application/dto/invitation/invitation.dto.ts";

export interface IListPendingInvitationsUseCase {
  execute(clinicId: string): Promise<InvitationSummaryDTO[]>;
}
