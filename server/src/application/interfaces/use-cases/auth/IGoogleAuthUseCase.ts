import type { GoogleAuthResponseDTO } from "@application/dto/auth/oauth.dto.ts";
import type { OAuthProfile } from "@application/interfaces/services/IOAuthService.ts";

export interface IGoogleAuthUseCase {
    execute(dto: OAuthProfile, intent?: "signup" | "signin") : Promise<GoogleAuthResponseDTO>
}
