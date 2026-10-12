import crypto from "crypto";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IEmailService } from "../../../domain/services/IEmailService";
import { ICacheService } from "../../../domain/services/ICacheService";
import { ForgotPasswordDto } from "../../dto/auth/PasswordResetDto";
import { buildPasswordResetKey } from "../../../shared/constants/redis-keys.constant";

const RESET_TOKEN_TTL_SECONDS = 60 * 30;

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly cacheService: ICacheService,
  ) {}

  public async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.password) {
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    await this.cacheService.set(
      buildPasswordResetKey(token),
      user._id.toString(),
      RESET_TOKEN_TTL_SECONDS,
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetLink,
    );
  }
}
