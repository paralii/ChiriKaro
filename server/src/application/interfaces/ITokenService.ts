import { Role } from "../../domain/value-objects/Role.js";

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload extends TokenPayload {
  jti: string;
}

export interface GeneratedRefreshToken {
  token: string;
  jti: string;
  expiresInSeconds: number;
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): GeneratedRefreshToken;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): RefreshTokenPayload;
}

// generateInvitationToken()