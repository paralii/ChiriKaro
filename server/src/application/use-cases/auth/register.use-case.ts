import { User } from "@domain/entities/user.entity.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { ConflictError } from "@shared/errors/index.ts";

import type { RegisterDTO } from "@application/dto/auth/register.dto.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type { ITokenService } from "@application/interfaces/services/ITokenService.ts";
import type { ICacheService } from "@application/interfaces/services/ICacheService.ts";
import type { IOtpService } from "@application/interfaces/services/IOtpService.ts";
import type { IEmailService } from "@application/interfaces/services/IEmailService.ts";
import type { IIdGenerator } from "@application/interfaces/services/IIdGenerator.ts";

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly cacheService: ICacheService,
    private readonly otpService: IOtpService,
    private readonly emailService: IEmailService,
    private readonly idGenerator: IIdGenerator,
  ) {}

  public async execute(dto: RegisterDTO) {
    const emailExists = await this.userRepository.existsByEmail(dto.email);
    if (emailExists) {
      throw new ConflictError("Email is already registered");
    }

    if (!dto.password && !dto.googleId) {
      throw new Error(
        "A password or Google authentication credential is required",
      );
    }

    const passwordHash = dto.password
      ? await this.passwordService.hash(dto.password)
      : undefined;
    const user = User.create({
      id: this.idGenerator.generate(),
      name: dto.name,
      email: dto.email,
      role: dto.role ?? Role.PATIENT,
      clinicId: dto.clinicId,
      ...(passwordHash ? { passwordHash } : {}),
      ...(dto.googleId ? { googleId: dto.googleId } : {}),
      ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
      isEmailVerified: false,
    });

    const { code, codeHash, expiresAt } = this.otpService.generate();

    await this.cacheService.set(
      `registration-otp:${user.id}`,
      JSON.stringify({ codeHash, expiresAt, attempts: 0 }),
      Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
    );

    await this.userRepository.save(user);

    try {
      await this.emailService.sendOtpEmail(
        user.email,
        user.name,
        code,
        "registration",
      );
    } catch {
      await this.cacheService.del(`registration-otp:${user.id}`);
      throw new Error(
        "Registration could not be completed because the verification email failed. Please try again.",
      );
    }


    return {
      user: user.toSafeObject(),
      message: "Registration successful, Please verify your email",
    };
  }
}
