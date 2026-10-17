import type { Role } from "@domain/value-objects/Role.ts";

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  clinicId?: string | null;
}

export interface GeneratedRefreshToken {
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): GeneratedRefreshToken;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
  revokeRefreshToken(refreshToken: string): Promise<void>;
}

