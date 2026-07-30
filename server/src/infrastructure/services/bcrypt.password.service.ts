import bcrypt from "bcryptjs";
import type { IPasswordService } from "../../application/interfaces/IPasswordService.js";
import { AUTH_CONSTANTS } from "../../shared/constants/auth.constants.js";

export class PasswordService implements IPasswordService {
  public async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, AUTH_CONSTANTS.SALT_ROUNDS);
  }

  public async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
