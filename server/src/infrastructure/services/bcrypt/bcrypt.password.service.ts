import bcrypt from "bcryptjs";
import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import { PASSWORD_CONFIG } from "@infrastructure/services/bcrypt/bcrypt.config.ts";

export class PasswordService implements IPasswordService {
  public async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, PASSWORD_CONFIG.SALT_ROUNDS);
  }

  public async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
