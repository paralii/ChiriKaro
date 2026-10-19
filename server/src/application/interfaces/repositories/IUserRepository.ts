import { User } from "@domain/entities/user.entity.js";
import { Role } from "@domain/value-objects/Role.js";

export interface IUserRepository {
findById(id: string): Promise<User | null>;
findByEmail(email: string): Promise<User | null>;
findByGoogleId(googleId: string): Promise<User | null>;
findByClinic(clinicId: string): Promise<User[]>;
existsByEmail(email: string): Promise<boolean>;
existsByRole(role: Role): Promise<boolean>;
save(user: User): Promise<User>
update(user: User): Promise<User>;
}