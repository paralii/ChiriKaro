import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IPasswordService } from "../../../domain/services/IPasswordService";
import { ICacheService } from "../../../domain/services/ICacheService";
import { BadRequestError } from "../../../shared/errors";
import { ResetPasswordDto } from "../../dto/auth/PasswordResetDto";
import {
  buildPasswordResetKey,
  buildRefreshTokenPattern,
} from "../../../shared/constants/redis-keys.constant";

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly cacheService: ICacheService,
  ) {}

  public async execute(dto: ResetPasswordDto): Promise<void> {
    const resetKey = buildPasswordResetKey(dto.token);
    const userId = await this.cacheService.get<string>(resetKey);

    if (!userId) {
      throw new BadRequestError("Reset link is invalid or has expired");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestError("Reset link is invalid or has expired");
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    await this.userRepository.updateById(userId, { password: hashedPassword });
    await this.cacheService.del(resetKey);
    await this.cacheService.delByPattern(buildRefreshTokenPattern(userId));
  }
}
