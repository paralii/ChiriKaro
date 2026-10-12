import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { ITokenService } from "../../../domain/services/ITokenService";
import { ICacheService } from "../../../domain/services/ICacheService";
import { UnauthorizedError } from "../../../shared/errors";
import { buildRefreshTokenKey } from "../../../shared/constants/redis-keys.constant";

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenTtlSeconds: number;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly cacheService: ICacheService,
  ) {}

  public async execute(
    incomingRefreshToken: string,
  ): Promise<RefreshTokenResult> {
    const payload = this.tokenService.verifyRefreshToken(incomingRefreshToken);

    const storedKey = buildRefreshTokenKey(payload.sub, payload.jti);
    const isValid = await this.cacheService.exists(storedKey);
    if (!isValid) {
      throw new UnauthorizedError("Refresh token has been revoked");
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    await this.cacheService.del(storedKey);

    const tokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const accessToken = this.tokenService.generateAccessToken(tokenPayload);
    const {
      token: refreshToken,
      jti,
      expiresInSeconds,
    } = this.tokenService.generateRefreshToken(tokenPayload);

    await this.cacheService.set(
      buildRefreshTokenKey(user._id.toString(), jti),
      "1",
      expiresInSeconds,
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenTtlSeconds: expiresInSeconds,
    };
  }
}
