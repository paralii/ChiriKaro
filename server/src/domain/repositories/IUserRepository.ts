import { User } from "../entities/user.entity.js";
import { Role } from "../value-objects/Role.js";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByClinic(clinicId: string): Promise<User[]>;
  existsByRole(role: Role): Promise<boolean>;
  save(user: User): Promise<User>;
}