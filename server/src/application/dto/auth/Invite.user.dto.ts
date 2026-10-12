import type { Role } from "../../../domain/value-objects/Role.js";

export interface InviteUserDto {
  email: string;
  role: Role;
  clinicId: string;
}