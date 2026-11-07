export interface GeneratedInvitationToken {
  token: string;
  tokenHash: string;
}

export interface IInvitationTokenService {
  generate(): GeneratedInvitationToken;
  hash(token: string): string;
}
