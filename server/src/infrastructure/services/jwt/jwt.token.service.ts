import Jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { jwtConfig } from "@infrastructure/services/jwt/jwt.config.ts";
import type {
  ITokenService,
  TokenPayload,
  GeneratedRefreshToken,
} from "@application/interfaces/services/ITokenService.ts";


export class TokenService implements ITokenService {
  generateAccessToken(payload: TokenPayload): string {
    return Jwt.sign(
      {
        email: payload.email,
        role: payload.role,
        clinicId: payload.clinicId,
      },
      jwtConfig.accessSecret,
      {
        subject: payload.sub,
        expiresIn: jwtConfig.accessExpiresIn,
      },
    );
  }

  generateRefreshToken(payload: TokenPayload): GeneratedRefreshToken {
    const refreshToken = Jwt.sign(
      {
        email: payload.email,
        role: payload.role,
        clinicId: payload.clinicId,
      },
      jwtConfig.refreshSecret,
      {
        subject: payload.sub,
        expiresIn: jwtConfig.refreshExpiresIn,
      },
    );

    const decoded = Jwt.decode(refreshToken) as JwtPayload;

    return {
      refreshToken,
      expiresIn: decoded.exp! - decoded.iat!,
    };
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.verifyToken(token, jwtConfig.accessSecret);
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.verifyToken(token, jwtConfig.refreshSecret);
  }

  async revokeRefreshToken(_refreshToken: string): Promise<void> {}

  private verifyToken(token: string, secret: string): TokenPayload {
    const decoded = Jwt.verify(token, secret);

    if (
      typeof decoded === "string" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.role !== "string"
    ) {
      throw new Error("Invalid token payload");
    }

    const clinicId = decoded.clinicId;

    if (
      clinicId !== undefined &&
      clinicId !== null &&
      typeof clinicId !== "string"
    ) {
      throw new Error("Invalid clinicId in token");
    }

    return {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role as TokenPayload["role"],
      clinicId,
    };
  }
}
