import type { Role } from "@domain/value-objects/Role.ts";

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    clinicId: string | null;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}