import { UserStatus } from "@domain/enum/user-statues.enum.ts";
import { UnauthorizedError } from "@shared/errors/index.ts";

import type { RefreshTokenResult } from "@application/dto/auth/refresh-token.dto.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { ITokenService } from "@application/interfaces/services/ITokenService.ts";

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
  ) {}

  public async execute(refreshToken: string): Promise<RefreshTokenResult> {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findById(payload.sub);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };
    const accessToken = this.tokenService.generateAccessToken(tokenPayload);
    const { refreshToken: newRefreshToken, expiresIn } =
      this.tokenService.generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  }
}
