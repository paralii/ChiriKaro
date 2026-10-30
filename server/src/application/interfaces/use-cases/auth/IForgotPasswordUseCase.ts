import type { ForgotPasswordDto } from "@application/dto/auth/reset-password.dto.ts";

export interface IForgotPasswordUseCase {
    execute(dto: ForgotPasswordDto) : Promise<void>
}