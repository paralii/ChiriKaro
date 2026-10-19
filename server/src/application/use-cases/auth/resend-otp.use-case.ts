import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IOtpRepository } from "@application/interfaces/repositories/IOtpRepository.ts";

import type { IOtpService } from "@application/interfaces/services/IOtpService.ts";
import type { IEmailService } from "@application/interfaces/services/IEmailService.ts";

import type { ResendOtpDto } from "@application/dto/auth/resend-otp.dto.ts";

export class ResendOtpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly otpRepository: IOtpRepository,

    private readonly otpService: IOtpService,
    private readonly emailService: IEmailService,
  ) {}

  public async execute(dto: ResendOtpDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.isEmailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    const otpKey = `registration-otp:${user.id}`;

    const { code, codeHash, expiresAt } = this.otpService.generate();

    const ttlSeconds = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );

    await this.otpRepository.save(
      otpKey,
      {
        codeHash,
        expiresAt,
        attempts: 0,
      },
      ttlSeconds,
    );

    try {
      await this.emailService.sendOtpEmail(
        user.email,
        user.name,
        code,
        "registration",
      );
    } catch {
      await this.otpRepository.delete(otpKey);

      throw new Error(
        "Unable to resend the verification email. Please try again.",
      );
    }
  }
}
