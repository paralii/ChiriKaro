import { ICacheService } from "../../../domain/services/ICacheService";
import { ITokenService } from "../../../domain/services/ITokenService";
import {
  buildRefreshTokenKey,
  buildRefreshTokenPattern,
} from "../../../shared/constants/redis-keys.constant";

export class LogoutUseCase {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly cacheService: ICacheService,
  ) {}

  public async execute(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      try {
        const payload = this.tokenService.verifyRefreshToken(refreshToken);
        await this.cacheService.del(
          buildRefreshTokenKey(payload.sub, payload.jti),
        );
        return;
      } catch {
        // fall through to revoke all sessions for the user
      }
    }

    await this.cacheService.delByPattern(buildRefreshTokenPattern(userId));
  }
}
