import type {
  AcceptInvitationDTO,
  AcceptInvitationResultDTO,
} from "@application/dto/invitation/accept-invitation.dto.ts";

export interface IAcceptInvitationUseCase {
  execute(dto: AcceptInvitationDTO): Promise<AcceptInvitationResultDTO>;
}
