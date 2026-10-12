import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IOtpService } from "../../../domain/services/IOtpService";
import { BadRequestError, NotFoundError } from "../../../shared/errors";
import { VerifyOtpDto } from "../../dto/auth/OtpDto";
import { OTP_CONSTANTS } from "../../../shared/constants/otp.constants";

export class VerifyOtpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly otpService: IOtpService,
  ) {}

  public async execute(dto: VerifyOtpDto): Promise<void> {
    const user = await this.userRepository.findByEmailWithOtp(dto.email);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.isEmailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    if (!user.otp) {
      throw new BadRequestError(
        "No verification code was requested. Please request a new one.",
      );
    }

    if (user.otp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestError(
        "Verification code has expired. Please request a new one.",
      );
    }

    if (user.otp.attempts >= OTP_CONSTANTS.MAX_ATTEMPTS) {
      throw new BadRequestError(
        "Too many incorrect attempts. Please request a new code.",
      );
    }

    const isValid = this.otpService.verify(dto.code, user.otp.codeHash);

    if (!isValid) {
      await this.userRepository.updateById(user._id.toString(), {
        $inc: { "otp.attempts": 1 },
      });
      throw new BadRequestError("Invalid verification code");
    }

    await this.userRepository.updateById(user._id.toString(), {
      isEmailVerified: true,
      $unset: { otp: 1 },
    });
  }
}
