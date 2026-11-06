import type { GetProfileResponseDTO } from "@application/dto/auth/get-user.dto.ts";

export interface IGetProfileUseCase {
    execute(userId: string): Promise<GetProfileResponseDTO>
}