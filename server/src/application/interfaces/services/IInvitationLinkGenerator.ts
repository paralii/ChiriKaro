export interface IInvitationLinkGenerator {
  generate(token: string): string;
}
