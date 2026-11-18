import { UserStatus } from "@domain/enum/user-statues.enum.ts";
import { UnauthorizedError } from "@shared/errors/index.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { canAccessClinicStatus } from "@domain/policies/clinic-access.policy.ts";

import type { RefreshTokenResult } from "@application/dto/auth/refresh-token.dto.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { ITokenService } from "@application/interfaces/services/ITokenService.ts";
import type { IRefreshTokenUseCase } from "@application/interfaces/use-cases/auth/IRefreshTokenUseCase.ts";

export class RefreshTokenUseCase implements IRefreshTokenUseCase{
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _clinicRepository: IClinicRepository,
    private readonly _tokenService: ITokenService,
  ) {}

  public async execute(refreshToken: string): Promise<RefreshTokenResult> {
    const payload = this._tokenService.verifyRefreshToken(refreshToken);

    const user = await this._userRepository.findById(payload.sub);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (user.role !== Role.PATIENT && user.role !== Role.SUPER_ADMIN) {
      if (!user.clinicId) throw new UnauthorizedError("Invalid refresh token");
      const clinic = await this._clinicRepository.findById(user.clinicId);
      if (!clinic || !canAccessClinicStatus(user.role, clinic.status)) {
        throw new UnauthorizedError("Invalid refresh token");
      }
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };
    const accessToken = this._tokenService.generateAccessToken(tokenPayload);
    const { refreshToken: newRefreshToken, expiresIn } =
      this._tokenService.generateRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  }
}
