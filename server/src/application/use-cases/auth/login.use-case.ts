import { UnauthorizedError } from "@shared/errors/index.ts";

import type { LoginDto, LoginResult } from "@application/dto/auth/login.dto.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type {
  ITokenService,
  TokenPayload,
} from "@application/interfaces/services/ITokenService.ts";
import type { ILoginUseCase } from "@application/interfaces/use-cases/auth/ILoginUseCase.ts";

export class LoginUseCase implements ILoginUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _passwordService: IPasswordService,
    private readonly _tokenService: ITokenService,
  ) {}

  public async execute(dto: LoginDto): Promise<LoginResult> {
    const user = await this._userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email");
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedError("Email not verified");
    }
    if (!user.passwordHash) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await this._passwordService.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
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
      },
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}
