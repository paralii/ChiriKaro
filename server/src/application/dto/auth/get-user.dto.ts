import type { Role } from "@domain/value-objects/Role.js";
import type { UserStatus } from "@domain/enum/user-statues.enum.ts";

export interface GetProfileResponseDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  clinicId: string | null;
  avatar: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}