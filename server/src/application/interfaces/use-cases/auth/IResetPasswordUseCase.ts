import type { ResetPasswordDto } from "@application/dto/auth/reset-password.dto.ts";

export interface IResetPasswordUseCase {
    execute(dto: ResetPasswordDto) : Promise<void>
}