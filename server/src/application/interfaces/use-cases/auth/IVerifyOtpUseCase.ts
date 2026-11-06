import type { VerifyOtpDto } from "@application/dto/auth/verify-otp.dto.ts";

export interface IVerifyOtpUseCase {
    execute(dto: VerifyOtpDto): Promise<void>
}