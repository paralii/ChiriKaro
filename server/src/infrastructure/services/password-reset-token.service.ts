import { randomBytes, createHash } from "node:crypto";

import type {
  GeneratedPasswordResetToken,
  IPasswordResetTokenService,
} from "@application/interfaces/services/IPasswordResetTokenService.js";

export class PasswordResetTokenService
  implements IPasswordResetTokenService
{
  private readonly expiresInMs = 15 * 60 * 1000;

  public generate(): GeneratedPasswordResetToken {
    const token = randomBytes(32).toString("hex");

    return {
      token,
      tokenHash: this.hash(token),
      expiresAt: new Date(Date.now() + this.expiresInMs),
    };
  }

  public hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}