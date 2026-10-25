import { Invitation } from "@domain/entities/Invitation.entity.ts";

export interface IInvitationRepository {
  findPendingByEmail(email: string): Promise<Invitation | null>;
  save(invitation: Invitation): Promise<Invitation>;
}