import type { LogoutDto } from "@application/dto/auth/logout.dto.ts";

import type { ITokenService } from "@application/interfaces/services/ITokenService.ts";

export class LogoutUseCase {
  constructor(
    private readonly tokenService: ITokenService,
  ) {}

  public async execute(dto : LogoutDto): Promise<void>{
    await this.tokenService.revokeRefreshToken(dto.refreshToken);
  }
}
