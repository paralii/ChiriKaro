import { Invitation } from "@domain/entities/Invitation.entity.ts";

export interface IInvitationRepository {
  findByToken(token: string): Promise<Invitation | null>;
  findPendingByEmail(email: string): Promise<Invitation | null>;
  save(invitation: Invitation): Promise<Invitation>;
}