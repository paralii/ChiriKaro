import type { Role } from "@domain/value-objects/Role.js";

export interface RegisterDTO {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: Role.PATIENT | Role.CLINIC_ADMIN;
  clinicId: string | null;
  avatar?: string | null;
}