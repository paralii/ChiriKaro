const MIN_LENGTH = 8;

export class Password {
  private constructor(private readonly plain: string) {}

  static create(raw: string): Password {
    if (raw.length < MIN_LENGTH) {
      throw new Error(`Password must be at least ${MIN_LENGTH} characters`);
    }
    if (!/[A-Z]/.test(raw)) {
      throw new Error("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(raw)) {
      throw new Error("Password must contain at least one number");
    }
    return new Password(raw);
  }

  get value(): string {
    return this.plain;
  }
}