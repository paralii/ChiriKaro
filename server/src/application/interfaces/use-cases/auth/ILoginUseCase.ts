import type { LoginDto, LoginResult } from "@application/dto/auth/login.dto.ts";

export interface ILoginUseCase {
  execute(dto: LoginDto): Promise<LoginResult>;
}