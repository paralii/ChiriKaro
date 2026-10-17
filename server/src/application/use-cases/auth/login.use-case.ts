import { UnauthorizedError } from "@shared/errors/index.ts";

import type { LoginDto, LoginResult } from "@application/dto/auth/login.dto.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type { ITokenService, TokenPayload } from "@application/interfaces/services/ITokenService.ts";

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
  ) {}

  public async execute(dto: LoginDto): Promise<LoginResult>{
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError("Invalid email");
    }
    if(!user.isEmailVerified) {
      throw new UnauthorizedError("Email not verified");
    }
    if (!user.passwordHash) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isPasswordValid = await this.passwordService.compare(
      dto.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const tokenPayload: TokenPayload ={
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
      clinicId: user.clinicId
    };

    const accessToken = this.tokenService.generateAccessToken(tokenPayload);
    
    const {
      refreshToken,
      expiresIn,
    } = this.tokenService.generateRefreshToken(tokenPayload);

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
