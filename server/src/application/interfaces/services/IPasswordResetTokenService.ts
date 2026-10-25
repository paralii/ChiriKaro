export interface GeneratedPasswordResetToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IPasswordResetTokenService {
  generate(): GeneratedPasswordResetToken;
  hash(token: string): string;
}