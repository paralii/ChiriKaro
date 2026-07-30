import Jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { jwtConfig } from "./jwt.config.js";
import type {
  ITokenService,
  TokenPayload,
  RefreshTokenPayload,
  GeneratedRefreshToken,
} from "../../application/interfaces/ITokenService.js";
import { parseDurationToSeconds } from "../../shared/utils/parseDuration.js";
import { UnauthorizedError } from "../../shared/errors/index.js";

export class TokenService implements ITokenService {
  public generateAccessToken(payload: TokenPayload): string {
    return Jwt.sign(payload, jwtConfig.accessSecret as string, {
      expiresIn: jwtConfig.accessExpiresIn,
    } as SignOptions);
  }

  public generateRefreshToken(payload: TokenPayload): GeneratedRefreshToken {
    const jti = randomUUID();
    const refreshPayload: RefreshTokenPayload = { ...payload, jti };

    const token = Jwt.sign(refreshPayload, jwtConfig.refreshSecret as string, {
      expiresIn: jwtConfig.refreshExpiresIn,
    } as SignOptions);

    const expiresInSeconds = parseDurationToSeconds(jwtConfig.refreshExpiresIn);

    return { token, jti, expiresInSeconds };
  }

  public verifyAccessToken(token: string): TokenPayload {
    try {
      return Jwt.verify(token, jwtConfig.accessSecret as string) as TokenPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  }

  public verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return Jwt.verify(token, jwtConfig.refreshSecret as string) as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }
}
