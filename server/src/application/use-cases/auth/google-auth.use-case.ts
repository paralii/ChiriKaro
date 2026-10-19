import { User } from "@domain/entities/user.entity.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";

import {
  ConflictError,
  UnauthorizedError,
} from "@shared/errors/index.js";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";

import type {
  ITokenService,
  TokenPayload,
} from "@application/interfaces/services/ITokenService.ts";
import type { IIdGenerator } from "@application/interfaces/services/IIdGenerator.ts";
import type { OAuthProfile } from "@application/interfaces/services/IOAuthService.ts";

import type {
  GoogleAuthResponseDTO,
} from "@application/dto/auth/oauth.dto.ts";

export class GoogleAuthUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly idGenerator: IIdGenerator,
  ) {}

  public async execute(
    profile: OAuthProfile,
  ): Promise<GoogleAuthResponseDTO> {
    if (!profile.googleId || !profile.email) {
      throw new UnauthorizedError("Invalid Google account");
    }
    if (!profile.emailVerified) {
      throw new UnauthorizedError("Google email must be verified");
    }

    let user = await this.userRepository.findByGoogleId(profile.googleId);

    if (!user) {
      const existingUser = await this.userRepository.findByEmail(profile.email);
      if (existingUser) {
        throw new ConflictError(
          "An account with this email already exists. " +
            "Sign in using the existing account and link Google securely.",
        );
      }

      user = User.create({
        id: this.idGenerator.generate(),
        name: profile.name,
        email: profile.email,
        role: Role.PATIENT,
        googleId: profile.googleId,
        avatar: profile.avatar ?? null,
        clinicId: null,
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
      });

      user = await this.userRepository.save(user);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("Your account is not active");
    }

    const tokenPayload: TokenPayload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };

    const accessToken = this.tokenService.generateAccessToken(tokenPayload);
    const { refreshToken, expiresIn } =
      this.tokenService.generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        avatar: user.avatar ?? null,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}
