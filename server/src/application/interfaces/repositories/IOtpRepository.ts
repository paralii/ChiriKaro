export interface OtpChallenge {
  codeHash: string;
  expiresAt: Date;
}

export interface IOtpRepository {
  save(key: string, challenge: OtpChallenge, ttlSeconds: number): Promise<void>;

  findByKey(key: string): Promise<OtpChallenge | null>;

  delete(key: string): Promise<void>;
}
