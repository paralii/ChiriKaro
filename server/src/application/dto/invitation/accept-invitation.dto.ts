import type { Role } from "@domain/value-objects/Role.ts";
import type { UserStatus } from "@domain/enum/user-statues.enum.ts";

export interface ValidateInvitationResultDTO {
  email: string;
  role: Role;
  clinicId: string;
  clinicName: string;
  expiresAt: Date;
}

export interface AcceptInvitationDTO {
  token: unknown;
  name: unknown;
  password: unknown;
}

export interface AcceptInvitationResultDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId: string | null;
  status: UserStatus;
}
