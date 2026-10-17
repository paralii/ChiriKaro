import { User } from "@domain/entities/user.entity.js";

export interface IUserRepository {
findById(id: string): Promise<User | null>;
findByEmail(email: string): Promise<User | null>;
findByGoogleId(googleId: string): Promise<User | null>;
findByClinic(clinicId: string): Promise<User[]>;
save(user: User): Promise<User>
}