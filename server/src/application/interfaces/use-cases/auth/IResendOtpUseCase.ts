import type { ResendOtpDto } from "@application/dto/auth/verify-otp.dto.ts";

export interface IResendOtpUseCase {
    execute(dto: ResendOtpDto) : Promise<void>
}