import type { LogoutDto } from "@application/dto/auth/logout.dto.ts";

export interface ILogoutUseCase {
    execute(dto: LogoutDto): Promise<void>
}