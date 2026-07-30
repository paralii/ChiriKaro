export interface GeneratedOtp {
  code: string;
  codeHash: string;
  expiresAt: Date;
}

export interface IOtpService {
  generate(): GeneratedOtp;
  hash(code: string): string;
  verify(code: string, codeHash: string): boolean;
}
