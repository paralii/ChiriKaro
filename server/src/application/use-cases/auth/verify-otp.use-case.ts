import { BadRequestError, NotFoundError, ValidationError } from "@shared/errors/index.ts";
import { normalizeValidatedEmail } from "@shared/utils/email-validation.ts";

import type { IVerifyOtpUseCase } from "@application/interfaces/use-cases/auth/IVerifyOtpUseCase.ts";
import type { VerifyOtpDto } from "@application/dto/auth/verify-otp.dto.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IOtpRepository } from "@application/interfaces/repositories/IOtpRepository.ts";
import type { IOtpService } from "@application/interfaces/services/IOtpService.ts";

export class VerifyOtpUseCase implements IVerifyOtpUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _otpRepository: IOtpRepository,
    private readonly _otpService: IOtpService,
  ) {}

  public async execute(dto: VerifyOtpDto): Promise<void> {
    const email = normalizeValidatedEmail(dto.email);
    if (!email || typeof dto.code !== "string" || !/^\d{6}$/.test(dto.code)) throw new ValidationError("Enter a valid email address and 6-digit verification code");
    const user = await this._userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.isEmailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    const otpKey = `registration-otp:${user.id}`;
    const challenge = await this._otpRepository.findByKey(otpKey);
    if (!challenge) {
      throw new BadRequestError("Invalid or expired verification code");
    }

    if (challenge.expiresAt.getTime() <= Date.now()) {
      await this._otpRepository.delete(otpKey);

      throw new BadRequestError("Invalid or expired verification code");
    }

    const isValid = this._otpService.verify(dto.code, challenge.codeHash);

    if (!isValid) {
      throw new BadRequestError("Invalid verification code");
    }

    user.verifyEmail();

    await this._userRepository.update(user);

    await this._otpRepository.delete(otpKey);
  }
}
