import type { InvitationSummaryDTO } from "@application/dto/invitation/invitation.dto.ts";

export interface IResendInvitationUseCase {
  execute(invitationId: string, clinicId: string): Promise<InvitationSummaryDTO>;
}
