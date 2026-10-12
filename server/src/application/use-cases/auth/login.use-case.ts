import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IPasswordService } from "../../../domain/services/IPasswordService";
import { ITokenService } from "../../../domain/services/ITokenService";
import { ICacheService } from "../../../domain/services/ICacheService";
import { LoginDto } from "../../dto/auth/LoginDto";
import { AuthResponseDto } from "../../dto/auth/AuthResponseDto";
import { UnauthorizedError } from "../../../shared/errors";
import { buildRefreshTokenKey } from "../../../shared/constants/redis-keys.constant";

export interface LoginResult {
  authResponse: AuthResponseDto;
  refreshToken: string;
  refreshTokenTtlSeconds: number;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly cacheService: ICacheService,
  ) {}

  public async execute(dto: LoginDto): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(dto.email, true);

    if (!user || !user.password) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await this.passwordService.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

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
}
