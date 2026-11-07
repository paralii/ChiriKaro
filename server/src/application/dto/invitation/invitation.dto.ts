import type { Role } from "@domain/value-objects/Role.ts";
import type { InvitationStatus } from "@domain/enum/invitation-status.enum.ts";

export interface CreateInvitationDTO {
  clinicId: string;
  invitedBy: string;
  email: string;
  role: Role;
}

export interface InvitationSummaryDTO {
  id: string;
  email: string;
  role: Role;
  clinicId: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}
