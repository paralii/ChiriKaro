import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordResetTokenRepository } from "@application/interfaces/repositories/IPasswordResetTokenRepository.js";

import type { IEmailService } from "@application/interfaces/services/IEmailService.ts";
import type { IPasswordResetTokenService } from "@application/interfaces/services/IPasswordResetTokenService.js";

import type { ForgotPasswordDto } from "@application/dto/auth/reset-password.dto.ts";

import type { IPasswordResetLinkGenerator } from "@application/interfaces/services/ILinkGenerator.ts";
import type { IForgotPasswordUseCase } from "@application/interfaces/use-cases/auth/IForgotPasswordUseCase.ts";
import { normalizeValidatedEmail } from "@shared/utils/email-validation.ts";

export class ForgotPasswordUseCase implements IForgotPasswordUseCase{
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly _passwordResetTokenService: IPasswordResetTokenService,
    private readonly _emailService: IEmailService,
    private readonly _passwordResetLinkGenerator: IPasswordResetLinkGenerator,
  ) {}

  public async execute(dto: ForgotPasswordDto): Promise<void> {
    const email = normalizeValidatedEmail(dto.email);
    if (!email) return;
    const user = await this._userRepository.findByEmail(email);
    if (!user) {
      return;
    }

    const generatedToken = this._passwordResetTokenService.generate();

    await this._passwordResetTokenRepository.deleteByUserId(user.id);

    await this._passwordResetTokenRepository.save({
      userId: user.id,
      tokenHash: generatedToken.tokenHash,
      expiresAt: generatedToken.expiresAt,
    });

    const resetLink = this._passwordResetLinkGenerator.generate(
      generatedToken.token,
    );

    await this._emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetLink,
    );
  }
}
