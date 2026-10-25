import crypto from "node:crypto";
import type { IOtpService, GeneratedOtp } from "@application/interfaces/services/IOtpService.ts";
import { OTP_CONSTANTS } from "@shared/constants/otp.constants.js";

export class OtpService implements IOtpService {
  public generate(): GeneratedOtp {
    const code = crypto
      .randomInt(0, 10 ** OTP_CONSTANTS.OTP_LENGTH)
      .toString()
      .padStart(OTP_CONSTANTS.OTP_LENGTH, "0");
    const codeHash = this.hash(code);
    const expiresAt = new Date(
      Date.now() + OTP_CONSTANTS.OTP_TTL_MINUTES * 60 * 1000,
    );

    return { code, codeHash, expiresAt };
  }

  public hash(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  public verify(code: string, codeHash: string): boolean {
    const candidateHash = this.hash(code);
    const candidateBuffer = Buffer.from(candidateHash, "hex");
    const storedBuffer = Buffer.from(codeHash, "hex");

    if (candidateBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  }
}
