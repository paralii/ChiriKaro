import { UnauthorizedError, ValidationError } from "@shared/errors/index.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";

import type { LoginDto, LoginResult } from "@application/dto/auth/login.dto.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type {
  ITokenService,
  TokenPayload,
} from "@application/interfaces/services/ITokenService.ts";
import type { ILoginUseCase } from "@application/interfaces/use-cases/auth/ILoginUseCase.ts";
import { normalizeValidatedEmail } from "@shared/utils/email-validation.ts";

export class LoginUseCase implements ILoginUseCase {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _passwordService: IPasswordService,
    private readonly _tokenService: ITokenService,
  ) {}

  public async execute(dto: LoginDto): Promise<LoginResult> {
    const email = normalizeValidatedEmail(dto.email);
    if (!email) throw new ValidationError("Enter a valid email address");
    const user = await this._userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email");
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("This account is not active");
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
