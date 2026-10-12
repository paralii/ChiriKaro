import { Role } from "../../../domain/value-objects/Role.js";

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
}
