import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { ITokenService } from "../../../domain/services/ITokenService";
import { ICacheService } from "../../../domain/services/ICacheService";
import { GoogleProfile } from "../../../domain/services/IOAuthService";
import { AuthResponseDto } from "../../dto/auth/AuthResponseDto";
import { Role } from "../../../shared/enums/Role.enum";
import { buildRefreshTokenKey } from "../../../shared/constants/redis-keys.constant";
import { IUser } from "../../../domain/entities/User.entity";

export interface GoogleAuthResult {
  authResponse: AuthResponseDto;
  refreshToken: string;
  refreshTokenTtlSeconds: number;
}

export class GoogleAuthUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly cacheService: ICacheService,
  ) {}

  public async execute(profile: GoogleProfile): Promise<GoogleAuthResult> {
    const user = await this.resolveUser(profile);

    const tokenPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const accessToken = this.tokenService.generateAccessToken(tokenPayload);
    const {
      token: refreshToken,
      jti,
      expiresInSeconds,
    } = this.tokenService.generateRefreshToken(tokenPayload);

    await this.cacheService.set(
      buildRefreshTokenKey(user._id.toString(), jti),
      "1",
      expiresInSeconds,
    );

    return {
      authResponse: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
        accessToken,
      },
      refreshToken,
      refreshTokenTtlSeconds: expiresInSeconds,
    };
  }

  private async resolveUser(profile: GoogleProfile): Promise<IUser> {
    const byGoogleId = await this.userRepository.findByGoogleId(
      profile.googleId,
    );
    if (byGoogleId) {
      return byGoogleId;
    }

    const byEmail = await this.userRepository.findByEmail(profile.email);
    if (byEmail) {
      const linked = await this.userRepository.updateById(
        byEmail._id.toString(),
        {
          googleId: profile.googleId,
          isEmailVerified: true,
          avatar: byEmail.avatar ?? profile.avatar,
        },
      );
      return linked ?? byEmail;
    }

    return this.userRepository.create({
      name: profile.name,
      email: profile.email.toLowerCase(),
      googleId: profile.googleId,
      avatar: profile.avatar,
      role: Role.PATIENT,
      isEmailVerified: true,
    });
  }
}
