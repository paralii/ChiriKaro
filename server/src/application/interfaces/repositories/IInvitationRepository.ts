import { Invitation } from "@domain/entities/Invitation.entity.ts";

export interface IInvitationRepository {
  findPendingByEmail(email: string, clinicId: string): Promise<Invitation | null>;
  findPendingById(id: string, clinicId: string): Promise<Invitation | null>;
  findPendingByClinic(clinicId: string): Promise<Invitation[]>;
  save(invitation: Invitation): Promise<Invitation>;
  deleteById(id: string): Promise<void>;
}
