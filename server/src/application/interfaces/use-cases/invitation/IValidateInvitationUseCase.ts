import type { ValidateInvitationResultDTO } from "@application/dto/invitation/accept-invitation.dto.ts";

export interface IValidateInvitationUseCase {
  execute(token: unknown): Promise<ValidateInvitationResultDTO>;
}
