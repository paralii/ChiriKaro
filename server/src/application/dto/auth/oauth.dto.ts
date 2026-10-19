import type { Role } from "@domain/value-objects/Role.js";

export interface GoogleAuthRequestDTO {
  credential: string;
}

export interface GoogleAuthResponseDTO {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    clinicId: string | null;
    avatar: string | null;
    isEmailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
