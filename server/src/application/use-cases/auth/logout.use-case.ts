import type { LogoutDto } from "@application/dto/auth/logout.dto.ts";

import type { ITokenService } from "@application/interfaces/services/ITokenService.ts";
import type { ILogoutUseCase } from "@application/interfaces/use-cases/auth/ILogoutUseCase.ts";

export class LogoutUseCase implements ILogoutUseCase{
  constructor(private readonly _tokenService: ITokenService) {}

  public async execute(dto: LogoutDto): Promise<void> {
    await this._tokenService.revokeRefreshToken(dto.refreshToken);
  }
}
