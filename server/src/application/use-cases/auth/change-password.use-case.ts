import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type { ChangePasswordDto } from "@application/dto/auth/change-password.dto.ts";

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
  ) {}

  public async execute(dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(dto.userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.passwordHash) {
      throw new BadRequestError("Password change is unavailable for this account");
    }

    const isPasswordValid = await this.passwordService.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestError("Current password is incorrect");
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestError(
        "New password must differ from the current password",
      );
    }

    const newPasswordHash = await this.passwordService.hash(
      dto.newPassword,
    );

    user.changePasswordHash(newPasswordHash);

    await this.userRepository.update(user);
  }
}