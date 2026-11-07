import type { Invitation } from "@domain/entities/Invitation.entity.ts";
import type { InvitationSummaryDTO } from "@application/dto/invitation/invitation.dto.ts";

export const toInvitationSummaryDTO = (
  invitation: Invitation,
): InvitationSummaryDTO => ({
  id: invitation.id,
  email: invitation.email,
  role: invitation.role,
  clinicId: invitation.clinicId,
  status: invitation.status,
  expiresAt: invitation.expiresAt,
  createdAt: invitation.createdAt,
});
