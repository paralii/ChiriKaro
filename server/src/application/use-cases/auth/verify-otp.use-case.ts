import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";

import type{ VerifyOtpDto } from "@application/dto/auth/verify-otp.dto.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IOtpRepository } from "@application/interfaces/repositories/IOtpRepository.ts";
import type { IOtpService } from "@application/interfaces/services/IOtpService.ts";

export class VerifyOtpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly otpRepository: IOtpRepository,
    private readonly otpService: IOtpService,
  ) {}

  public async execute(dto: VerifyOtpDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.isEmailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    const otpKey = `registration-otp:${user.id}`;

    const challenge = await this.otpRepository.findByKey(otpKey);

    if (!challenge) {
      throw new BadRequestError("Invalid or expired verification code");
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      await this.otpRepository.delete(otpKey);

      throw new BadRequestError("Invalid or expired verification code");
    }

    const isValid = this.otpService.verify(
      dto.code,
      challenge.codeHash,
    );

    if (!isValid) {
      throw new BadRequestError("Invalid verification code");
    }

    user.verifyEmail();

    await this.userRepository.update(user);

    await this.otpRepository.delete(otpKey);
  }
}
