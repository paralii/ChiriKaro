import { User } from "@domain/entities/user.entity.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";

import { ConflictError, UnauthorizedError } from "@shared/errors/index.js";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";

import type {
  ITokenService,
  TokenPayload,
} from "@application/interfaces/services/ITokenService.ts";
import type { OAuthProfile } from "@application/interfaces/services/IOAuthService.ts";

import type { GoogleAuthResponseDTO } from "@application/dto/auth/oauth.dto.ts";
import type { IGoogleAuthUseCase } from "@application/interfaces/use-cases/auth/IGoogleAuthUseCase.ts";

export class GoogleAuthUseCase implements IGoogleAuthUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _tokenService: ITokenService,
  ) {}

  public async execute(
    profile: OAuthProfile,
    intent: "signup" | "signin" = "signin",
  ): Promise<GoogleAuthResponseDTO> {
    if (!profile.googleId || !profile.email) {
      throw new UnauthorizedError("Invalid Google account");
    }
    if (!profile.emailVerified) {
      throw new UnauthorizedError("Google email must be verified");
    }

    let user = await this._userRepository.findByGoogleId(profile.googleId);

    if (intent === "signup" && user && user.role !== Role.PATIENT) {
      throw new ConflictError(
        "Google sign-up is currently available for patient accounts only",
      );
    }

    if (!user) {
      const existingUser = await this._userRepository.findByEmail(
        profile.email,
      );
      if (existingUser) {
        if (intent === "signup") {
          throw new ConflictError(
            "An account with this email already exists. Sign in with that account or use Google sign-in if it is already linked.",
          );
        }
        throw new ConflictError(
          "An account with this email already exists. " +
            "Sign in using the existing account and link Google securely.",
        );
      }

      if (intent === "signup" && !profile.emailVerified) {
        throw new UnauthorizedError("Google email must be verified");
      }

      user = User.create({
        name: profile.name,
        email: profile.email,
        role: Role.PATIENT,
        googleId: profile.googleId,
        avatar: profile.avatar ?? null,
        clinicId: null,
        isEmailVerified: true,
        status: UserStatus.ACTIVE,
      });

      user = await this._userRepository.save(user);
    } else if (user.email.toLowerCase() !== profile.email.toLowerCase()) {
      throw new ConflictError(
        "Google account email does not match the linked account",
      );
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

    const accessToken = this._tokenService.generateAccessToken(tokenPayload);
    const { refreshToken, expiresIn } =
      this._tokenService.generateRefreshToken(tokenPayload);

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
