import { BadRequestError } from "@shared/errors/index.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordResetTokenRepository } from "@application/interfaces/repositories/IPasswordResetTokenRepository.js";

import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type { IPasswordResetTokenService } from "@application/interfaces/services/IPasswordResetTokenService.js";

import type { ResetPasswordDto } from "@application/dto/auth/reset.password.dto.ts";

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly passwordService: IPasswordService,
    private readonly passwordResetTokenService: IPasswordResetTokenService,
  ) {}

  public async execute(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.passwordResetTokenService.hash(dto.token);

    const resetToken =
      await this.passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!resetToken || resetToken.expiresAt <= new Date()) {
      throw new BadRequestError("Invalid or expired password reset token");
    }

    const user = await this.userRepository.findById(resetToken.userId);

    if (!user) {
      throw new BadRequestError("Invalid or expired password reset token");
    }

    const passwordHash = await this.passwordService.hash(dto.newPassword);

    user.changePasswordHash(passwordHash);

    await this.userRepository.update(user);

    await this.passwordResetTokenRepository.deleteByUserId(user.id);
  }
}
