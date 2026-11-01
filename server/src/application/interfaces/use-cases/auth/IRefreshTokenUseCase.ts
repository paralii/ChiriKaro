import type { RefreshTokenResult } from "@application/dto/auth/refresh-token.dto.ts";

export interface IRefreshTokenUseCase {
    execute(refreshToken: string): Promise<RefreshTokenResult>;
}