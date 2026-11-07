import type {
  CreateInvitationDTO,
  InvitationSummaryDTO,
} from "@application/dto/invitation/invitation.dto.ts";

export interface ICreateInvitationUseCase {
  execute(dto: CreateInvitationDTO): Promise<InvitationSummaryDTO>;
}
