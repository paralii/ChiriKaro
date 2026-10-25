import { Role } from "@domain/value-objects/Role.js";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";
import { randomUUID } from "node:crypto";
import { User } from "@domain/entities/user.entity.js";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { PasswordService } from "@infrastructure/services/bcrypt/bcrypt.password.service.ts";

import { logger } from "@infrastructure/logger/logger.js";

interface SeedSuperAdminDependencies {
  name: string;
  email: string;
  password: string;
  userRepository: IUserRepository;
  passwordService: Pick<PasswordService, "hash">;
}

export const seedSuperAdmin = async ({
  name,
  email,
  password,
  userRepository,
  passwordService,
}: SeedSuperAdminDependencies): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await userRepository.findByEmail(normalizedEmail);

  if (existing) {
    if (existing.role !== Role.SUPER_ADMIN) {
      throw new Error(
        `The configured admin email is already used by a ${existing.role} account`,
      );
    }

    logger.warn(
      `Seed skipped: a super admin with email "${normalizedEmail}" already exists`,
    );

    return;
  }

  const hashedPassword = await passwordService.hash(password);

  const admin = User.create({
    id: randomUUID(),
    name,
    email: normalizedEmail,
    passwordHash: hashedPassword,
    role: Role.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    clinicId: null,
    isEmailVerified: true,
  });

  const savedAdmin = await userRepository.save(admin);

  logger.info(`Seeded first admin: ${savedAdmin.email}`);
};
