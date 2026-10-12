import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IOtpService } from "../../../domain/services/IOtpService";
import { IEmailService } from "../../../domain/services/IEmailService";
import { ICacheService } from "../../../domain/services/ICacheService";
import { BadRequestError, NotFoundError } from "../../../shared/errors";
import { ResendOtpDto } from "../../dto/auth/OtpDto";
import { OTP_CONSTANTS } from "../../../shared/constants/otp.constants";
import { buildOtpResendCooldownKey } from "../../../shared/constants/redis-keys.constant";

export class ResendOtpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly otpService: IOtpService,
    private readonly emailService: IEmailService,
    private readonly cacheService: ICacheService,
  ) {}

  public async execute(dto: ResendOtpDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.isEmailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    const cooldownKey = buildOtpResendCooldownKey(user._id.toString());
    const isCoolingDown = await this.cacheService.exists(cooldownKey);

    if (isCoolingDown) {
      throw new BadRequestError("Please wait before requesting another code");
    }

    const { code, codeHash, expiresAt } = this.otpService.generate();

    await this.userRepository.updateById(user._id.toString(), {
      otp: { codeHash, expiresAt, attempts: 0 },
    });

    await this.cacheService.set(
      cooldownKey,
      "1",
      OTP_CONSTANTS.RESEND_COOLDOWN_SECONDS,
    );
    await this.emailService.sendOtpEmail(user.email, user.name, code, "registration");
  }
}
