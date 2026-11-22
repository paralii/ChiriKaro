import { ValidationError } from "@shared/errors/index.ts";

const PASSWORD_PATTERN = /^(?=.*\p{Lu})(?=.*\d)(?=.*[^\p{L}\p{N}\s])\S{8,128}$/u;

export function assertValidNewPassword(password: unknown): asserts password is string {
  if (typeof password !== "string" || !PASSWORD_PATTERN.test(password)) {
    throw new ValidationError("Password must be 8 to 128 characters, contain an uppercase letter, a number, and a special character, and contain no spaces");
  }
}
