import type { ChangePasswordDto } from "@application/dto/auth/change-password.dto.ts";

export interface IChangePasswordUseCase {
    execute(dto: ChangePasswordDto): Promise<void>
}