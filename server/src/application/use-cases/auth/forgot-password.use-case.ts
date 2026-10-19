import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordResetTokenRepository } from "@application/interfaces/repositories/IPasswordResetTokenRepository.js";

import type { IEmailService } from "@application/interfaces/services/IEmailService.ts";
import type { IPasswordResetTokenService } from "@application/interfaces/services/IPasswordResetTokenService.js";

import type { ForgotPasswordDto } from "@application/dto/auth/reset.password.dto.ts";

import type { IPasswordResetLinkGenerator } from "@application/interfaces/services/ILinkGenerator.ts";

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly passwordResetTokenService: IPasswordResetTokenService,
    private readonly emailService: IEmailService,
    private readonly passwordResetLinkGenerator: IPasswordResetLinkGenerator,
  ) {}

  public async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      return
    }

    const generatedToken = this.passwordResetTokenService.generate();

    await this.passwordResetTokenRepository.deleteByUserId(user.id);

    await this.passwordResetTokenRepository.save({
      userId: user.id,
      tokenHash: generatedToken.tokenHash,
      expiresAt: generatedToken.expiresAt,
    });

    const resetLink = this.passwordResetLinkGenerator.generate(
      generatedToken.token,
    );

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetLink,
    );
  }
}
