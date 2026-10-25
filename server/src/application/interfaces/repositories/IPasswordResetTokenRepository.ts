export interface PasswordResetTokenRecord {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IPasswordResetTokenRepository {
  findByTokenHash(tokenHash: string) : Promise<PasswordResetTokenRecord | null >;
  save(record: PasswordResetTokenRecord): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}