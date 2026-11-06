import type { RegisterDTO } from "@application/dto/auth/register.dto.ts";
import type { UserProps } from "@domain/entities/user.entity.ts";

export interface IRegisterUseCase {
  execute(dto: RegisterDTO): Promise<{
    user: Omit<UserProps, "passwordHash">;
    message: string;
  }>;
}