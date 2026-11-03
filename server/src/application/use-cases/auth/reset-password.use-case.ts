import { BadRequestError } from "@shared/errors/index.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordResetTokenRepository } from "@application/interfaces/repositories/IPasswordResetTokenRepository.js";

import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type { IPasswordResetTokenService } from "@application/interfaces/services/IPasswordResetTokenService.js";

import type { ResetPasswordDto } from "@application/dto/auth/reset-password.dto.ts";
import type { IResetPasswordUseCase } from "@application/interfaces/use-cases/auth/IResetPasswordUseCase.ts";

export class ResetPasswordUseCase implements IResetPasswordUseCase{
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly _passwordService: IPasswordService,
    private readonly _passwordResetTokenService: IPasswordResetTokenService,
  ) {}

  public async execute(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this._passwordResetTokenService.hash(dto.token);

    const resetToken =
      await this._passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!resetToken || resetToken.expiresAt <= new Date()) {
      throw new BadRequestError("Invalid or expired password reset token");
    }

    const user = await this._userRepository.findById(resetToken.userId);

    if (!user) {
      throw new BadRequestError("Invalid or expired password reset token");
    }

    const passwordHash = await this._passwordService.hash(dto.newPassword);

    user.changePasswordHash(passwordHash);

    await this._passwordResetTokenRepository.deleteByUserId(user.id);
    
    await this._userRepository.update(user);

  }
}
