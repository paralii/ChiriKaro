import { User } from "@domain/entities/user.entity.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { ConflictError, ValidationError } from "@shared/errors/index.ts";

import type { IRegisterUseCase } from "@application/interfaces/use-cases/auth/IRegisterUseCase.ts";
import type { RegisterDTO } from "@application/dto/auth/register.dto.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IOtpRepository } from "@application/interfaces/repositories/IOtpRepository.ts";
import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type { IOtpService } from "@application/interfaces/services/IOtpService.ts";
import type { IEmailService } from "@application/interfaces/services/IEmailService.ts";

export class RegisterUseCase implements IRegisterUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _passwordService: IPasswordService,
    private readonly _otpService: IOtpService,
    private readonly _otpRepository: IOtpRepository,
    private readonly _emailService: IEmailService,
  ) {}

  public async execute(dto: RegisterDTO) {
    const emailExists = await this._userRepository.existsByEmail(dto.email);
    if (emailExists) {
      throw new ConflictError("Email is already registered");
    }

    const hasPassword = Boolean(dto.password?.trim());
    const hasGoogleId = Boolean(dto.googleId?.trim());

    if (hasPassword === hasGoogleId) {
      throw new ValidationError(
        "Provide either a password or Google authentication, not both",
      );
    }

    const passwordHash = dto.password
      ? await this._passwordService.hash(dto.password)
      : undefined;

    const user = User.create({
      name: dto.name,
      email: dto.email,
      role: dto.role ?? Role.PATIENT,
      clinicId: dto.clinicId,
      ...(passwordHash ? { passwordHash } : {}),
      ...(dto.googleId ? { googleId: dto.googleId } : {}),
      ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
      isEmailVerified: false,
    });

    const { code, codeHash, expiresAt } = this._otpService.generate();

    const persistedUser = await this._userRepository.save(user);

    const otpKey = `registration-otp:${persistedUser.id}`;

    const ttlSeconds = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );

    try {
      await this._otpRepository.save(
        otpKey,
        {
          codeHash,
          expiresAt,
        },
        ttlSeconds,
      );

      await this._emailService.sendOtpEmail(
        persistedUser.email,
        persistedUser.name,
        code,
        "registration",
      );
    } catch {
      await Promise.allSettled([
        this._otpRepository.delete(otpKey),
        this._userRepository.deleteById(persistedUser.id),
      ]);

      throw new Error(
        "Registration could not be completed during verification setup. Please try again.",
      );
    }
    return {
      user: persistedUser.toSafeObject(),
      message: "Registration successful, Please verify your email",
    };
  }
}
